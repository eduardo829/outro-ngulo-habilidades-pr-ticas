import type { ReactNode } from "react";
import { PublicLayout, DraftNotice } from "@/components/PublicLayout";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PublicLayout>
      <article className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-4xl font-extrabold">{title}</h1>
        <div className="mt-6"><DraftNotice /></div>
        <div className="mt-8 space-y-4 leading-relaxed text-muted-foreground [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground">
          {children}
        </div>
      </article>
    </PublicLayout>
  );
}
