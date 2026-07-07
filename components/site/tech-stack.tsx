import { siReact, siTypescript, siTailwindcss, siTradingview, siFramer, siShadcnui } from "simple-icons";

const TECHNOLOGIES = [siReact, siTypescript, siTailwindcss, siTradingview, siFramer, siShadcnui];

export function TechStack() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
      {TECHNOLOGIES.map((icon) => (
        <svg key={icon.slug} role="img" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <title>{icon.title}</title>
          <path d={icon.path} />
        </svg>
      ))}
    </div>
  );
}
