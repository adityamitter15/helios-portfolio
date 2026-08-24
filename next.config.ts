import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project. Without it, Next.js's root auto-detection can walk
  // up and find an unrelated package-lock.json higher in the home directory and warn about it.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Stops Next.js 16 from writing its own agent instruction files into the project root
  // on every dev and build run. This project keeps its brief in docs/DESIGN-SPEC.md instead.
  agentRules: false,
};

export default nextConfig;
