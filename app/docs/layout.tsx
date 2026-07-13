import { DocsPager, DocsSidebarNav } from "@/components/site/docs-nav";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-6xl gap-8 px-4 py-8">
      <aside className="hidden w-52 shrink-0 sm:block">
        <DocsSidebarNav />
      </aside>
      <div className="min-w-0 flex-1">
        {children}
        <div className="max-w-3xl">
          <DocsPager />
        </div>
      </div>
    </div>
  );
}
