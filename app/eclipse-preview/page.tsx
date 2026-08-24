import { EclipseMark } from "@/components/ui/eclipse-mark";

export default function EclipsePreview() {
  return (
    <main className="flex min-h-svh items-center justify-center gap-12 bg-void p-12">
      <EclipseMark className="h-[340px] w-[340px]" />
      <EclipseMark className="h-24 w-24" />
      <EclipseMark className="h-8 w-8" />
      <div className="h-40 w-40 rounded-2xl bg-text p-4">
        <EclipseMark className="h-full w-full" />
      </div>
    </main>
  );
}
