import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ShowcaseTile({
  href,
  title,
  description,
  children,
  className,
}: {
  href: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("block h-full", className)}>
      <Card className="h-full transition-colors hover:border-violet-500/50">
        <CardContent className="flex items-center justify-center overflow-hidden">
          {children}
        </CardContent>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
