"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { useSkipHeavyFx } from "@/hooks/use-reduced-motion";
import type { CloudShaderProps } from "@/components/ui/cloud-shader";
import type { BackgroundCubesGridProps } from "@/components/ui/background-cubes-grid";

/**
 * Guarded wrappers around the heavy Aceternity effects.
 * - Dynamically imported (no SSR, smaller initial bundle)
 * - Render nothing extra when the user prefers reduced motion
 *   or is on a touch / small screen
 * - Each accepts a `fallback` rendered instead (usually a static gradient)
 */

const CloudShaderInner = dynamic(
  () => import("@/components/ui/cloud-shader").then((m) => m.CloudShader),
  { ssr: false }
);
const CubesGridInner = dynamic(
  () => import("@/components/ui/background-cubes-grid").then((m) => m.BackgroundCubesGrid),
  { ssr: false }
);
const GlobeInner = dynamic(
  () => import("@/components/ui/3d-globe").then((m) => m.Globe3D),
  { ssr: false }
);
const CanvasTextInner = dynamic(
  () => import("@/components/ui/canvas-text").then((m) => m.CanvasText),
  { ssr: false }
);
const DottedGlowInner = dynamic(
  () => import("@/components/ui/dotted-glow-background").then((m) => m.DottedGlowBackground),
  { ssr: false }
);

function Guard({ fallback, children }: { fallback?: ReactNode; children: ReactNode }) {
  const skip = useSkipHeavyFx();
  if (skip) return <>{fallback ?? null}</>;
  return <>{children}</>;
}

export function FxCloudShader(props: CloudShaderProps & { fallback?: ReactNode }) {
  const { fallback, ...rest } = props;
  return (
    <Guard fallback={fallback}>
      <CloudShaderInner {...rest} />
    </Guard>
  );
}

export function FxCubesGrid(props: BackgroundCubesGridProps & { fallback?: ReactNode }) {
  const { fallback, ...rest } = props;
  return (
    <Guard fallback={fallback}>
      <CubesGridInner {...(rest as BackgroundCubesGridProps)} />
    </Guard>
  );
}

import type { GlobeMarker } from "@/components/ui/3d-globe";

export function FxGlobe({
  fallback,
  markers,
  className,
}: {
  fallback?: ReactNode;
  markers?: GlobeMarker[];
  className?: string;
}) {
  return (
    <Guard fallback={fallback}>
      <GlobeInner markers={markers} className={className} />
    </Guard>
  );
}

export function FxCanvasText({
  text,
  fallback,
  className,
}: {
  text: string;
  fallback?: ReactNode;
  className?: string;
}) {
  return (
    <Guard fallback={fallback ?? <span className={className}>{text}</span>}>
      <CanvasTextInner text={text} className={className} />
    </Guard>
  );
}

export function FxDottedGlow({
  className,
  fallback,
}: {
  className?: string;
  fallback?: ReactNode;
}) {
  return (
    <Guard fallback={fallback}>
      <DottedGlowInner className={className} />
    </Guard>
  );
}
