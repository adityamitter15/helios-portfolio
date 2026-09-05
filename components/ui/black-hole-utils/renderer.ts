/**
 * WebGL plumbing for the black hole. The picture itself lives in ./shader.ts; this file is only
 * responsible for getting it on screen and, just as importantly, for getting out of the way when
 * it should not be running at all.
 *
 * A raymarched geodesic integrator is the most expensive thing on this page by a wide margin, and
 * it sits in the hero, which is the part of the page a visitor scrolls away from within seconds.
 * So the loop is gated three ways: it stops when the canvas leaves the viewport, it stops when the
 * tab is hidden, and it renders exactly one frame and then stops under prefers-reduced-motion.
 * Without those it would keep a GPU core busy for the entire visit, drain a laptop battery, and go
 * on doing it while the user reads the FAQ.
 */

import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";

export type BlackHoleStatus = "running" | "unsupported" | "context-lost";

type RGB = readonly [number, number, number];

export interface BlackHolePalette {
  /** White-hot, at the inner edge. */
  core: RGB;
  /** The body of the disk. */
  mid: RGB;
  /** The cool outer rim. */
  edge: RGB;
}

export interface CreateRendererOptions {
  canvas: HTMLCanvasElement;
  /** Renders a single still frame instead of animating. Defaults to reading the media query. */
  reducedMotion?: boolean;
  /** Scales the resolved pixel ratio. Below 1 trades sharpness for frame rate. */
  quality?: number;
  palette?: BlackHolePalette;
  exposure?: number;
  /**
   * Where the hole sits, in 0..1 fractions of the canvas, y from the top.
   * "auto" reads the canvas shape each frame: right of centre when it is landscape, so the disk
   * clears a column of type on the left, and high-centre when it is portrait, where a stacked
   * layout puts the type underneath instead.
   */
  center?: readonly [number, number] | "auto";
  /** Fires when the renderer settles, so a caller can reveal a CSS fallback if it never starts. */
  onStatus?: (status: BlackHoleStatus) => void;
}

export interface BlackHoleRenderer {
  /**
   * Resolves once the renderer has settled, with what actually happened.
   *
   * It deliberately never REJECTS. The calling component fires it as `void renderer.ready`, which
   * attaches no handler, so a rejection here would surface as an unhandled promise rejection (and
   * in Next.js dev, as an error overlay) every time someone opened the page on hardware without
   * WebGL2. Missing WebGL2 is an expected outcome on old hardware, not an exception.
   */
  ready: Promise<BlackHoleStatus>;
  dispose(): void;
}

/** The HELIOS ramp: chrome-white core through --color-bloom-b cyan to --color-bloom-c violet. */
const DEFAULT_PALETTE: BlackHolePalette = {
  core: [1.0, 0.99, 0.96],
  mid: [0.647, 0.886, 1.0],
  edge: [0.765, 0.741, 1.0],
};

/** Where "auto" puts the hole. See CreateRendererOptions.center. */
const AUTO_LANDSCAPE: readonly [number, number] = [0.7, 0.5];
// Portrait sits higher than centre. A phone hero is one full-width column of type with no room
// beside it, so the hole cannot be moved out of the way horizontally the way it can on a wide
// layout — it can only be moved up, above the block, and dimmed behind it (see the scrim in
// hero.tsx). Centred, the disk's brightest band cut straight across the wordmark.
const AUTO_PORTRAIT: readonly [number, number] = [0.5, 0.26];

/**
 * Integration budget per photon, and the ceiling on how many photons a frame may trace.
 *
 * Both numbers are measured rather than guessed. Timed on an M3 through ANGLE/Metal, forcing a
 * real GPU sync per frame with readPixels (a plain gl.finish() reports zero here, because a canvas
 * that is never composited has its work elided):
 *
 *     1.3M px @ 220 steps    4.4 ms
 *     2.4M px @ 220 steps    6.5 ms
 *     3.0M px @ 220 steps    7.6 ms
 *     6.0M px @ 220 steps   14.8 ms   (a full device-pixel render on a retina laptop)
 *
 * Two things follow. Pixels dominate and steps are close to free, so the budget is stated in total
 * pixels rather than as a device pixel ratio: a ratio cap cannot bound cost, because the cost then
 * scales with whatever window the visitor happens to open. And steps are affordable, so the
 * integrator keeps the accuracy that puts a clean edge on the shadow.
 *
 * 3.0M was 1.3M until the image was called grainy, and it was: 1.3M is under one device pixel per
 * CSS pixel on a retina display, so the whole frame was being upscaled before anyone saw it. At
 * 7.6ms there is room to stop doing that, and the shader's detail now scales itself to whatever
 * resolution it is handed (see the footprint term in shader.ts). The adaptive step-down in the loop
 * below is what covers hardware slower than the machine these numbers came from.
 */
const STEPS_HIGH = 220;
const STEPS_LOW = 120;
const MAX_PIXELS_HIGH = 3_000_000;
const MAX_PIXELS_LOW = 800_000;

/** Frame gaps above this are treated as a stall elsewhere, not as evidence the GPU is struggling. */
const DISCONTINUITY_MS = 250;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * A first guess at how hard this device can be pushed, before any frame has been timed.
 * Deliberately pessimistic: it is far better to start slightly soft than to start expensive and
 * hand someone a locked-up hero. Frame timing in the loop below only ever revises this downward.
 */
function isLowPowerDevice(): boolean {
  if (typeof window === "undefined") return true;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return coarse || cores <= 4;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

export function createRenderer(options: CreateRendererOptions): BlackHoleRenderer {
  const {
    canvas,
    quality = 1,
    palette = DEFAULT_PALETTE,
    exposure = 1.15,
    center = "auto",
    onStatus,
  } = options;

  let reduced = options.reducedMotion ?? prefersReducedMotion();

  let disposed = false;
  let frame = 0;
  let settle: (status: BlackHoleStatus) => void = () => {};
  const ready = new Promise<BlackHoleStatus>((resolve) => {
    settle = resolve;
  });

  const finish = (status: BlackHoleStatus) => {
    onStatus?.(status);
    settle(status);
  };

  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    desynchronized: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });

  if (!gl) {
    finish("unsupported");
    return { ready, dispose: () => { disposed = true; } };
  }

  // ------------------------------------------------------------------ program

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();

  if (!vs || !fs || !program) {
    finish("unsupported");
    return { ready, dispose: () => { disposed = true; } };
  }

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  // Some drivers require a bound VAO in WebGL2 even when the draw uses no attributes at all.
  const vao = gl.createVertexArray();

  const uniform = (name: string) => gl.getUniformLocation(program, name);
  let uResolution: WebGLUniformLocation | null = null;
  let uTime: WebGLUniformLocation | null = null;
  let uPointer: WebGLUniformLocation | null = null;
  let uSteps: WebGLUniformLocation | null = null;
  let uCore: WebGLUniformLocation | null = null;
  let uMid: WebGLUniformLocation | null = null;
  let uEdge: WebGLUniformLocation | null = null;
  let uExposure: WebGLUniformLocation | null = null;
  let uCenter: WebGLUniformLocation | null = null;

  // ------------------------------------------------------------------ state

  const lowPower = isLowPowerDevice();
  let maxPixels = (lowPower ? MAX_PIXELS_LOW : MAX_PIXELS_HIGH) * quality * quality;
  let steps = lowPower ? STEPS_LOW : STEPS_HIGH;
  let degradesLeft = 3;

  let width = 0;
  let height = 0;
  // Read, not assumed. This used to initialise to true and rely on the visibilitychange handler to
  // correct it, but that event never fires for a page that was ALREADY hidden when it loaded, so a
  // background tab would run the full loop while believing it was on screen — and, worse, feed its
  // throttled frame gaps to the sampler below as if they were GPU cost.
  let visible = typeof document === "undefined" || document.visibilityState === "visible";
  let onScreen = true;
  let needsRender = true;

  const start = performance.now();
  let lastFrameTime = 0;
  let sampleCount = 0;
  let sampleTotal = 0;

  // Pointer parallax, smoothed on the CPU so the camera eases rather than snapping.
  let pointerX = 0;
  let pointerY = 0;
  let targetX = 0;
  let targetY = 0;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);

    // Never more than one device pixel per CSS pixel (there is nothing in this image sharp enough
    // to repay supersampling), and then scaled down further to stay inside the frame budget. The
    // canvas is stretched back over its box by CSS, so the cost is a little softness on the photon
    // ring, which on a background this diffuse is close to invisible.
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      2, // nothing in this image survives past 2x, and DPR 3 phones would triple the cost for it
      Math.sqrt(maxPixels / (cssW * cssH)),
    );

    const w = Math.max(1, Math.round(cssW * ratio));
    const h = Math.max(1, Math.round(cssH * ratio));
    if (w === width && h === height) return;
    width = w;
    height = h;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    needsRender = true;
  };

  /**
   * Steps the whole thing down a notch if frames are consistently late. Runs at most twice, and
   * only ever downward: an adaptive scheme that can also climb back up oscillates, and the resize
   * flash on every change is worse than the resolution it buys back.
   */
  /**
   * Steps the whole thing down a notch if frames are consistently late, at most twice and only ever
   * downward: a scheme that can also climb back up oscillates, and the resize flash on each change
   * costs more than the resolution it wins back.
   *
   * Gaps longer than DISCONTINUITY_MS are thrown away rather than averaged. They are not evidence
   * about the GPU — they are a backgrounded tab, an occluded window, a long task somewhere else on
   * the page. Averaging them in is how an earlier revision talked itself into halving the
   * resolution of a hero that was rendering perfectly well: the window simply was not on screen, so
   * every "frame" was seconds apart. A genuinely slow GPU still trips this, because it produces
   * consistent 30-60ms frames, which are well inside the cutoff.
   *
   * Twelve samples, not forty: the check has to fire in wall-clock time, and on the hardware that
   * needs it most forty frames can be the better part of a minute.
   */
  const considerDegrading = (now: number) => {
    const dt = lastFrameTime === 0 ? 0 : now - lastFrameTime;
    lastFrameTime = now;

    if (dt <= 0 || dt > DISCONTINUITY_MS) {
      sampleCount = 0;
      sampleTotal = 0;
      return;
    }

    sampleTotal += dt;
    sampleCount++;
    if (sampleCount < 12) return;

    const avg = sampleTotal / sampleCount;
    sampleCount = 0;
    sampleTotal = 0;

    if (avg <= 26 || degradesLeft <= 0) return;
    degradesLeft--;
    maxPixels *= 0.55;
    steps = STEPS_LOW;
    width = 0; // force resize() to rebuild the drawing buffer
    resize();
  };

  const draw = (elapsedSeconds: number) => {
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform2f(uResolution, width, height);
    gl.uniform1f(uTime, elapsedSeconds);
    gl.uniform2f(uPointer, pointerX, pointerY);
    gl.uniform1i(uSteps, steps);
    gl.uniform3fv(uCore, palette.core as unknown as number[]);
    gl.uniform3fv(uMid, palette.mid as unknown as number[]);
    gl.uniform3fv(uEdge, palette.edge as unknown as number[]);
    gl.uniform1f(uExposure, exposure);
    const c = center === "auto" ? (width >= height ? AUTO_LANDSCAPE : AUTO_PORTRAIT) : center;
    gl.uniform2f(uCenter, c[0], c[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const tick = (now: number) => {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    if (!visible || !onScreen) return;

    resize();

    if (reduced) {
      // Still image, but not a blank one. The depth stays, the movement goes, which is the same
      // bargain components/ui/aurora.tsx strikes. 8.0s in is simply a frame where the disk looks
      // well wound-up rather than freshly seeded.
      if (!needsRender) return;
      needsRender = false;
      pointerX = 0;
      pointerY = 0;
      draw(8.0);
      return;
    }

    pointerX += (targetX - pointerX) * 0.045;
    pointerY += (targetY - pointerY) * 0.045;

    draw((now - start) / 1000);
    considerDegrading(now);
  };

  // ------------------------------------------------------------------ listeners

  const handlePointer = (event: PointerEvent) => {
    if (reduced) return;
    // Mouse only. pointermove fires for touch too, so on a phone every scroll drag over the hero
    // swung the camera under the reader's thumb — and because the listener is on window, it did so
    // even once the finger had left the canvas. There is no hover on touch, so there is nothing
    // this parallax can mean there.
    if (event.pointerType !== "mouse") return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    targetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    targetY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  };

  const handleVisibility = () => {
    visible = document.visibilityState === "visible";
    needsRender = true;
    // Whatever was half-measured belongs to the period before the tab went away.
    lastFrameTime = 0;
    sampleCount = 0;
    sampleTotal = 0;
  };

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    onStatus?.("context-lost");
  };

  const handleContextRestored = () => {
    if (disposed) return;
    width = 0;
    needsRender = true;
    frame = requestAnimationFrame(tick);
    onStatus?.("running");
  };

  const motionQuery =
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;

  const handleMotionChange = (event: MediaQueryListEvent) => {
    // Only honoured when the caller did not pin the value itself.
    if (options.reducedMotion !== undefined) return;
    reduced = event.matches;
    needsRender = true;
  };

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          needsRender = true;
          resize();
        })
      : null;

  const intersectionObserver =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            onScreen = entries.some((entry) => entry.isIntersecting);
            needsRender = true;
          },
          { rootMargin: "120px" },
        )
      : null;

  // ------------------------------------------------------------------ start

  const link = gl.getExtension("KHR_parallel_shader_compile") as {
    COMPLETION_STATUS_KHR: number;
  } | null;

  /** Cancellers for the link poll below, so dispose() can stop it mid-flight. */
  const pollTimers: Array<() => void> = [];

  /**
   * Resolves when the driver has finished linking, without blocking the main thread on it.
   *
   * Polled on a timer rather than on requestAnimationFrame. rAF is suspended outright while a page
   * is hidden, and this promise gates ALL of setup — sizing the canvas, attaching the observers,
   * resolving `ready` — so driving it from rAF meant a page opened in a background tab finished
   * none of that, and sat with a 300x150 default canvas until someone happened to look at it.
   * Whether a shader has finished compiling has nothing to do with frames, so it should not wait
   * for one.
   */
  const linked = new Promise<void>((resolve) => {
    if (!link) {
      resolve();
      return;
    }
    let timer = 0;
    const poll = () => {
      if (disposed || gl.getProgramParameter(program, link.COMPLETION_STATUS_KHR)) resolve();
      else timer = window.setTimeout(poll, 8);
    };
    pollTimers.push(() => clearTimeout(timer));
    poll();
  });

  void linked.then(() => {
    if (disposed) return;

    // A lost context reports every query as null, including LINK_STATUS, so it has to be ruled
    // out before a null is read as "the shader is broken". Checking it second would turn every
    // context loss into a misleading compile error with three null logs attached.
    if (gl.isContextLost()) {
      finish("context-lost");
      return;
    }

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // Only pull the logs once something has actually failed: getShaderInfoLog forces a
      // synchronous stall on the driver, which is the exact thing the parallel-compile extension
      // above exists to avoid. Compile status is read per shader so the message names the file
      // that is actually wrong rather than just reporting that linking did not work.
      if (process.env.NODE_ENV !== "production") {
        const stage = (label: string, shader: WebGLShader) =>
          gl.getShaderParameter(shader, gl.COMPILE_STATUS)
            ? null
            : `${label}: ${gl.getShaderInfoLog(shader)}`;
        console.error(
          "[black-hole] shader failed\n" +
            [
              stage("vertex", vs),
              stage("fragment", fs),
              gl.getProgramInfoLog(program) || null,
            ]
              .filter(Boolean)
              .join("\n"),
        );
      }
      finish("unsupported");
      return;
    }

    // The shader objects are baked into the program once it links; keeping them alive holds GPU
    // memory for no reason.
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    uResolution = uniform("uResolution");
    uTime = uniform("uTime");
    uPointer = uniform("uPointer");
    uSteps = uniform("uSteps");
    uCore = uniform("uCoreColor");
    uMid = uniform("uMidColor");
    uEdge = uniform("uEdgeColor");
    uExposure = uniform("uExposure");
    uCenter = uniform("uCenter");

    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    document.addEventListener("visibilitychange", handleVisibility);
    // Attached unconditionally, not gated on the current value of `reduced`. handlePointer already
    // returns early while reduced motion is on, and gating here instead meant that someone who
    // turned the preference OFF mid-visit never got the listener at all, because setup had already
    // run and only the flag changed.
    window.addEventListener("pointermove", handlePointer, { passive: true });
    motionQuery?.addEventListener("change", handleMotionChange);
    resizeObserver?.observe(canvas);
    intersectionObserver?.observe(canvas);

    resize();
    frame = requestAnimationFrame(tick);
    finish("running");
  });

  return {
    ready,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      for (const cancel of pollTimers) cancel();

      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pointermove", handlePointer);
      motionQuery?.removeEventListener("change", handleMotionChange);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();

      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);

      // Deliberately NOT calling WEBGL_lose_context here, though an earlier revision did and it
      // broke the component outright in development.
      //
      // getContext() is idempotent per canvas: it hands back the SAME context object every time,
      // so the renderer does not own that context, the <canvas> element does. React 18+ strict
      // mode mounts, unmounts and remounts every effect in development against the same DOM node,
      // which made the sequence: create renderer A, dispose A and lose the context, create
      // renderer B on the very same canvas and receive the context A had just killed. Every query
      // on it then returns null, so B reported a shader failure and the hero fell back to the CSS
      // gradient on every dev load.
      //
      // Nothing leaks by leaving it: the context's lifetime is the canvas element's, and React
      // drops that on unmount. Losing a context is only correct for a canvas this file created
      // itself, and it did not create this one.
    },
  };
}
