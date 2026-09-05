/**
 * GLSL for the black hole, kept apart from the WebGL plumbing in ./renderer.ts so each file stays
 * one job: this is the picture, that is the machinery.
 *
 * What is actually being simulated. Light near a black hole does not travel in straight lines, so
 * there is no surface to intersect and nothing a normal rasteriser can draw. Every pixel instead
 * launches a photon and integrates its path through curved spacetime until it either falls through
 * the horizon, hits the accretion disk, or escapes to the sky. That single fact produces every
 * feature people recognise in these images for free: the shadow, the ring of light around it, and
 * the disk apparently folding over the top of the hole (that is the FAR side of the disk, its light
 * bent up and over toward the camera).
 *
 * Units. Everything is in Schwarzschild radii, rs = 1. That puts the horizon at r = 1, the photon
 * sphere at r = 1.5, the shadow's edge at an impact parameter of about 2.6, and the innermost
 * stable circular orbit at r = 3, which is where the disk has to start.
 */

/** Full-screen triangle from gl_VertexID: no vertex buffer, no attributes, nothing to bind. */
export const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `#version 300 es
precision highp float;

out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;
uniform vec2  uPointer;    // -1..1, already smoothed on the CPU
uniform int   uSteps;      // integration budget, lowered on weak hardware
uniform vec3  uCoreColor;  // white-hot, at the ISCO
uniform vec3  uMidColor;   // the body of the disk
uniform vec3  uEdgeColor;  // the cool rim
uniform float uExposure;
uniform vec2  uCenter;     // where the hole sits, in 0..1 screen fractions, y measured from the top

const float RS       = 1.0;   // horizon, and the unit of length
const float DISK_IN  = 3.0;   // ISCO: gas inside this cannot hold an orbit, so the disk stops
const float DISK_OUT = 13.0;

/**
 * Seconds before an advection layer resets. See the crossfade in sampleDisk.
 *
 * The visible winding never exceeds about half of this, so it is really a statement about how far
 * the gas is allowed to shear before it is quietly re-seeded: at 6s the disk holds the broad,
 * soft look it has in the first few seconds after a reload, which is the point.
 */
const float SHEAR_CYCLE = 6.0;
const float ESCAPE_R = 42.0;  // backstop only; the outbound test below almost always fires first

// ---------------------------------------------------------------- hashing and noise

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  // Quintic, not the usual cubic f*f*(3-2f). Cubic smoothstep is only C1: its SECOND derivative
  // jumps at every lattice boundary, and across a field of this many cells the eye reads those
  // discontinuities as a faint grid of creases in the gas. Quintic is C2 and costs two multiplies.
  f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  return mix(
    mix(mix(hash31(i + vec3(0.0, 0.0, 0.0)), hash31(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 0.0)), hash31(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0.0, 0.0, 1.0)), hash31(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash31(i + vec3(0.0, 1.0, 1.0)), hash31(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}

// Three octaves, not four. The fourth sat below a pixel at every scale this is actually drawn at,
// so it cost 8 more hashes per call for detail nobody can resolve.
float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise3(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

/**
 * fbm with its high octaves faded out, for surfaces seen close to edge-on.
 *
 * \`lod\` runs 0 (grazing: one pixel spans a huge radial slice of the disk, so fine detail cannot
 * resolve and beats against the pixel grid instead) to 1 (face on, full detail). The result is
 * renormalised by the weights actually used, so dropping octaves changes how much DETAIL there is
 * without also changing how bright the disk is — otherwise the outer disk would visibly darken as
 * it turned edge-on, which is the opposite of what really happens.
 *
 * At lod = 1 this is arithmetically identical to fbm() above.
 */
float fbmLod(vec3 p, float lod) {
  float w0 = 0.5;
  float w1 = 0.25 * smoothstep(0.00, 0.35, lod);
  float w2 = 0.125 * smoothstep(0.30, 0.75, lod);
  float v = w0 * noise3(p);
  p *= 2.03;
  v += w1 * noise3(p);
  p *= 2.03;
  v += w2 * noise3(p);
  return v / (w0 + w1 + w2) * 0.875;
}

// ---------------------------------------------------------------- the accretion disk

/** Gas density at one radius, for a single advection phase. Called twice, see sampleDisk. */
float diskDensity(float r, float phase, float lod) {
  vec2 sw = vec2(cos(phase), sin(phase)) * r;

  float d = clamp(fbmLod(vec3(sw * 0.42, r * 0.30 - uTime * 0.06), lod) * 1.45, 0.0, 1.0);
  d = mix(d, d * d, lod);  // sharpen only where the geometry can actually carry the contrast

  // A finer pass on top, which is where the thin bright filaments come from. One octave, not a
  // second fbm: this rides on top of the shape d already has, so the lower octaves it would add
  // are ones d already carries. Blended toward a mean of 1 rather than swinging 0.55..2.05,
  // because a product of two noise fields has far heavier tails than either and those outliers
  // are exactly the bright speckle that used to read as grain.
  float streak = noise3(vec3(sw * 1.25, r * 0.60 + uTime * 0.10));
  d *= mix(1.0, 0.75 + 0.5 * streak, 0.55 * lod);

  return d;
}

/**
 * Emission and coverage where a photon crosses the disk plane.
 *
 * \`dir\` is the photon's direction of travel at the crossing, which is needed twice: once for the
 * Doppler shift (is this gas coming toward the camera or away), and once for the path length
 * through a slab of finite thickness (a grazing ray sees far more gas than a perpendicular one).
 */
vec4 sampleDisk(vec3 p, vec3 dir, float footprint) {
  float r = length(p.xz);
  float t = clamp((r - DISK_IN) / (DISK_OUT - DISK_IN), 0.0, 1.0);

  // Keplerian rate. Angular velocity goes as r^-3/2, so the inner edge laps the rim many times
  // over, and sampling the gas in a frame that turns at the LOCAL rate is what makes this read as
  // a fluid being wound up rather than one rigid pinwheel being spun.
  float ang = atan(p.z, p.x);
  float rr = max(r, 0.6);
  float omega = 7.0 * inversesqrt(rr) / rr;  // r^-3/2, without a pow

  // How much of the disk this one pixel actually covers, in world units, decides how much detail
  // it is allowed to ask for. An incidence test alone was a stand-in for this: it knew the ray was
  // grazing but not how far away it was or how big a pixel is, so it over-blurred a close disk and
  // still aliased a distant one. Feeding the true footprint also means the image sharpens by itself
  // when the canvas is rendered at a higher resolution, instead of staying locked to one tuning.
  float lod = 1.0 - smoothstep(0.10, 0.65, footprint);

  // Bounded advection, in two layers that each reset and are crossfaded so the reset is never seen.
  //
  // This exists because differential rotation cannot simply be integrated forever. The phase
  // difference between two neighbouring radii grows as t * dw/dr, without limit, so the gas winds
  // into finer and finer concentric striations the longer the page is left open: smooth for the
  // first few seconds, visibly ringed by about eight, and shredded into moire by a minute. It never
  // recovers, because nothing in a straight ang + uTime*omega ever brings the radii back into
  // step.
  //
  // So each layer only ever winds for SHEAR_CYCLE seconds before being re-seeded, and the two run
  // half a cycle apart. The weights are triangular and sum to 1, and each layer's weight falls to
  // zero exactly when it resets, which is what hides the discontinuity. A layer is therefore at
  // full strength when it is only half-wound, so what you actually see never exceeds roughly three
  // seconds of shear -- the look it has just after a reload, held indefinitely.
  //
  // This is the standard flowmap double-buffer, and it costs a second density evaluation. The
  // alternative, damping the shear to a stop, freezes the differential motion that is the whole
  // point of the disk.
  float s0 = fract(uTime / SHEAR_CYCLE);
  float s1 = fract(uTime / SHEAR_CYCLE + 0.5);
  float wA = 1.0 - abs(2.0 * s0 - 1.0);

  float d = mix(
    diskDensity(r, ang + omega * s1 * SHEAR_CYCLE, lod),
    diskDensity(r, ang + omega * s0 * SHEAR_CYCLE, lod),
    wA
  );

  // Radial envelope: fades up off the ISCO, and out well before the geometric rim so the disk
  // ends in gas rather than in a cut circle.
  d *= smoothstep(0.0, 0.09, t) * (1.0 - smoothstep(0.62, 1.0, t));

  // Temperature ramp, HELIOS palette: chrome-white at the ISCO through cyan to violet at the rim.
  vec3 col = mix(uCoreColor, uMidColor, smoothstep(0.0, 0.34, t));
  col = mix(col, uEdgeColor, smoothstep(0.30, 0.95, t));

  // Brightness falls steeply outward.
  float emit = 1.0 / (0.22 + 2.6 * t * t);

  // --- relativity, which is most of what sells the image ---

  // Orbital velocity as a fraction of c, tangential, Keplerian.
  vec3 vdir = normalize(vec3(-p.z, 0.0, p.x));
  float beta = clamp(sqrt(0.5 * RS / max(r, 1.2)), 0.0, 0.72);

  // dir travels away from the camera, so -dir points back at it: mu > 0 is gas approaching.
  float mu = dot(vdir, -dir);
  float gamma = inversesqrt(max(1.0 - beta * beta, 1e-3));
  float doppler = 1.0 / max(gamma * (1.0 - beta * mu), 1e-3);

  // Gravitational redshift: light climbing out of the well loses energy.
  float grav = sqrt(max(1.0 - RS / max(r, RS * 1.02), 0.0));
  float shift = doppler * grav;

  // Relativistic beaming. Specific intensity scales as the shift cubed, which is why one side of
  // the ring burns out to white and the other nearly disappears. Without this the disk reads as a
  // flat glowing hoop and the whole thing looks like clip art.
  emit *= clamp(shift * shift * shift, 0.03, 9.0);

  // Colour follows the shift as well as the brightness.
  col = mix(col, uCoreColor, clamp((shift - 1.0) * 0.85, 0.0, 0.80));
  col = mix(col, uEdgeColor * 0.55, clamp((1.0 - shift) * 0.70, 0.0, 0.65));

  // Path length through a slab of finite thickness. The disk is integrated as an infinitely thin
  // plane (below), so this is what gives it body at grazing angles.
  float slab = clamp(0.16 / max(abs(dir.y), 0.035), 0.35, 3.2);

  float dens = clamp(d * slab, 0.0, 1.4);
  return vec4(col * emit * dens, clamp(dens * 0.90, 0.0, 1.0));
}

// ---------------------------------------------------------------- the sky behind it

vec3 starField(vec3 dir) {
  vec3 acc = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec3 p = dir * (48.0 + fk * 78.0);
    vec3 cell = floor(p);
    float h = hash31(cell + fk * 37.7);
    if (h > 0.966) {
      // Jittered off the cell centre, otherwise the field betrays its grid.
      vec3 j = vec3(hash31(cell + 3.1), hash31(cell + 5.7), hash31(cell + 7.3)) - 0.5;
      float b = smoothstep(0.5, 0.0, length(p - cell - 0.5 - j * 0.6));
      float b2 = b * b;
      b = b2 * b2 * b2;  // b^6, not b^12: a star tighter than a pixel cannot be drawn, only aliased
      // Twinkle slowed right down and halved in depth. At b^12 with a 1.7 rad/s beat every star was
      // crossing its own resolution limit several times a second, which is not a twinkle, it is
      // per-pixel noise with a period.
      float tw = 0.86 + 0.14 * sin(uTime * 0.6 + h * 220.0);
      vec3 tint = mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.96, 0.90), hash31(cell + 11.3));
      acc += b * tw * tint * (0.70 + fk * 0.50);
    }
  }
  // A faint nebula, so the void is not a flat black rectangle where nothing is lensed.
  float n = clamp(fbm(dir * 2.6 + 11.0), 0.0, 1.0);
  return acc + (n * n * n) * mix(uEdgeColor, uMidColor, 0.5) * 0.05;
}

// ---------------------------------------------------------------- geodesic integration

vec3 trace(vec3 ro, vec3 rd) {
  vec3 pos = ro;
  vec3 vel = rd;

  // Angular momentum is conserved along a null geodesic, so the whole orbit collapses to a single
  // acceleration term and h2 can be hoisted out of the loop.
  vec3 h = cross(pos, vel);
  float h2 = dot(h, h);

  // Angular size of one pixel, matching the 1.75 focal length used to build rd in main(). This is
  // what lets the disk sampling scale its detail to the resolution actually being rendered.
  float pixelAngle = 2.0 / (uResolution.y * 1.75);

  vec3 acc = vec3(0.0);
  float trans = 1.0;
  float minR = 1e9;
  bool captured = false;

  for (int i = 0; i < uSteps; i++) {
    float r2 = dot(pos, pos);
    float r = sqrt(r2);
    minR = min(minR, r);

    if (r < RS) { captured = true; break; }

    // Outbound and already past the disk's outer edge: there is nothing left in front of this
    // photon, so the remaining steps would only re-integrate empty space to reach the same sky.
    // Gravity out here is far too weak to bend it back. This is the single biggest saving in the
    // shader — the camera sits at r = 17, outside DISK_OUT, so every ray pointing away from the
    // hole now costs one iteration instead of marching all the way to the old escape radius.
    if (r > DISK_OUT && dot(pos, vel) > 0.0) break;

    // Fine where the bending happens, coarse out in the flat parts.
    float dt = clamp(0.052 * r, 0.010, 0.62);

    vec3 prev = pos;
    vec3 a = -1.5 * h2 * pos / (r2 * r2 * r);
    vel += a * dt;
    pos += vel * dt;

    // Disk crossing, solved by interpolating exactly to the y = 0 plane rather than accepting
    // wherever the step happened to land. At up to 0.62 units per step the disk would otherwise
    // break into visible rungs.
    if (prev.y * pos.y < 0.0) {
      float f = prev.y / (prev.y - pos.y);
      vec3 hit = mix(prev, pos, f);
      float hr = length(hit.xz);
      if (hr > DISK_IN && hr < DISK_OUT) {
        vec3 nvel = normalize(vel);

        // How wide a slice of the disk this single pixel actually covers where it cuts the plane.
        // A grazing ray, far from the camera, can span several world units here, which is exactly
        // why the OUTER disk was the grainiest part of the picture: that is where the rays are both
        // furthest away and closest to edge-on.
        float fp = length(hit - ro) * pixelAngle / max(abs(nvel.y), 0.02);

        // Three taps spread along the ray across that slice, rather than one point sample of it.
        // This is the real fix for the grain. Fading detail out (the lod in sampleDisk) only stops
        // the pixel asking for structure it cannot resolve; averaging across the footprint actually
        // integrates the structure it does cover, so the outer disk keeps its filaments instead of
        // trading them for either speckle or blur.
        float ss = clamp(fp * 0.42, 0.0, 1.5);
        vec4 s = (sampleDisk(hit - nvel * ss, nvel, fp)
                + sampleDisk(hit, nvel, fp)
                + sampleDisk(hit + nvel * ss, nvel, fp)) * (1.0 / 3.0);
        // Emissive volume accumulation. The ray is NOT stopped at the first crossing: a photon can
        // cut the plane three or four times on its way past, and those later crossings are exactly
        // what paints the far side of the disk arcing over the shadow.
        acc += s.rgb * trans;
        trans *= 1.0 - s.a;
        if (trans < 0.004) break;
      }
    }
  }

  if (!captured && trans > 0.004) {
    acc += starField(normalize(vel)) * trans;
  }

  // The photon ring: light that got close enough to the photon sphere at r = 1.5 to wind around
  // the hole before escaping. Resolving it purely by integration needs a step budget no phone can
  // afford, so it is added analytically from the closest approach instead.
  float ring = smoothstep(2.10, 1.50, minR) * smoothstep(1.00, 1.35, minR);
  acc += uCoreColor * ring * 0.30;

  return acc;
}

// ---------------------------------------------------------------- tone mapping and entry

vec3 aces(vec3 x) {
  const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag * 2.0 - uResolution) / uResolution.y;

  // Slide the whole ray field so the hole lands where the layout wants it rather than dead centre.
  // In the hero it has to clear the type column on the left: centred, the disk's brightest band
  // runs straight through the h1, and no scrim heavy enough to fix that would leave the black hole
  // visible. gl_FragCoord counts up from the bottom, hence the flip on y.
  float aspect = uResolution.x / uResolution.y;
  uv -= vec2(aspect * (2.0 * uCenter.x - 1.0), 1.0 - 2.0 * uCenter.y);

  // Near edge-on on purpose. This is the one camera where the lensed underside of the disk arcs
  // over the top of the shadow; tilt further and it flattens into a ring with a dot in it.
  // Bounded, not monotonic. At a constant 0.021 rad/s the camera completed a full orbit every five
  // minutes, which swaps the Doppler-brightened side and rebuilds the composition from scratch on a
  // page that is meant to look the way it looked when it loaded. An oscillation keeps it alive
  // without ever taking it anywhere: +/- 0.075 rad, about four degrees, over a 100 second period.
  float yaw   = 0.075 * sin(uTime * 0.063) + uPointer.x * 0.30;
  float pitch = 0.155 + uPointer.y * 0.10;

  vec3 ro = vec3(sin(yaw) * cos(pitch), sin(pitch), cos(yaw) * cos(pitch)) * 17.0;
  vec3 fwd = normalize(-ro);
  vec3 rgt = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up  = cross(fwd, rgt);

  vec3 col = trace(ro, normalize(fwd * 1.75 + rgt * uv.x + up * uv.y));

  col = aces(col * uExposure);

  vec2 q = frag / uResolution;  // screen space on purpose: the vignette frames the canvas, not the hole
  col *= 0.55 + 0.45 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.22);

  // Dither before the 8-bit write, because a field this dark and this smooth bands badly without
  // it. Deliberately STATIC: it used to be reseeded from uTime every frame, and while +/- half a
  // code point is invisible in a mid-tone, against a ground this close to black it is a tenth of
  // the signal, so re-rolling it 60 times a second turned the whole sky into crawling grain. A
  // fixed pattern breaks the bands just as well and holds perfectly still.
  col += (hash21(frag) - 0.5) / 255.0;

  fragColor = vec4(col, 1.0);
}
`;
