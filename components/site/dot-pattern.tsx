import { cn } from "@/lib/utils";

export interface DotPatternProps {
  className?: string;
}

const TILE = 18;
const OFFSET = TILE / 2;
const DRIFT = TILE * 2;

/** A staggered (brick-lattice) dot grid, radially masked so the center (behind
 *  the hero text) still shows a faint trace of the pattern - so it reads as
 *  part of the same background rather than a cutout - while the ring around
 *  the text is at full strength and it fades out again toward the far edges.
 *  The offset rows are what set this apart from the plain aligned dot grids
 *  used elsewhere (e.g. Magic UI's Dot Pattern) while staying just as clean.
 *
 *  The drift is a `transform: translate` animation (not `background-position`)
 *  so it's GPU-composited instead of repainted every frame - animating a 1px
 *  radial-gradient dot via background-position resamples it at a new
 *  sub-pixel offset each frame, which reads as the dots "lighting up"/pulsing
 *  brighter over the loop. The mask lives on the static outer wrapper so the
 *  halo shape never moves; only the inner (oversized, to avoid edge gaps)
 *  dot layer translates. Pauses under prefers-reduced-motion.
 *
 *  Dot color is dimmed in dark mode specifically: `currentColor` off
 *  `text-foreground` is near-white there, which read as too bright/glowy
 *  against a near-black background - `dark:text-muted-foreground` swaps in a
 *  mid-gray instead, at lower opacity, for a lower-key look. */
export function DotPattern({ className }: DotPatternProps) {
  const maskImage =
    "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.15) 30%, black 60%, transparent 100%)";
  const dot = "radial-gradient(currentColor 1px, transparent 1px)";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none overflow-hidden", className)}
      style={{ maskImage, WebkitMaskImage: maskImage }}
    >
      <div
        className="voraui-dot-pattern-drift absolute text-foreground/40 dark:text-muted-foreground/25"
        style={{
          inset: `-${DRIFT}px`,
          backgroundImage: `${dot}, ${dot}`,
          backgroundSize: `${TILE}px ${TILE}px, ${TILE}px ${TILE}px`,
          backgroundPosition: `0 0, ${OFFSET}px ${OFFSET}px`,
        }}
      />
      <style href="voraui-dot-pattern" precedence="low">{`
        @keyframes voraui-dot-drift {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-${DRIFT}px, -${DRIFT}px, 0); }
        }
        .voraui-dot-pattern-drift { animation: voraui-dot-drift 40s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .voraui-dot-pattern-drift { animation: none; }
        }
      `}</style>
    </div>
  );
}
