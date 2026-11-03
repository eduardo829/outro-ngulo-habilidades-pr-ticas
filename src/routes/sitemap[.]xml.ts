import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import { isSitemapRouteIncluded, sitemapPathForLocation, sitemapStaticPaths, sitemapXML, type SitemapEntry } from "@/lib/sitemap";
import { GESTORES } from "@/lib/gestores";

const BASE_URL = "https://outroangulo.com";

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        const router = await getRouterInstance();
        const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));

        // Gestores: coleção local (src/lib/gestores.ts)
        const gestorRoute = router.routesById["/gestor/$slug"];
        if (isSitemapRouteIncluded(gestorRoute)) {
          for (const g of GESTORES) {
            const location = router.buildLocation({ to: "/gestor/$slug", params: { slug: g.slug }, search: () => ({}), hash: "" });
            const path = sitemapPathForLocation(router, location, "/gestor/$slug");
            if (path) entries.push({ path });
          }
        }

        // Cursos publicados: leitura pública e paginada da tabela courses
        const cursoRoute = router.routesById["/cursos/$slug"];
        if (isSitemapRouteIncluded(cursoRoute)) {
          const { createClient } = await import("@supabase/supabase-js");
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
              fetch: (input, init) => {
                const headers = new Headers(init?.headers);
                if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) headers.delete("Authorization");
                headers.set("apikey", key);
                return fetch(input, { ...init, headers });
              },
            },
          });
          const pageSize = 1000;
          for (let offset = 0; ; ) {
            const { data, error } = await supabase
              .from("courses")
              .select("slug")
              .eq("status", "published")
              .eq("is_public", true)
              .order("id")
              .range(offset, offset + pageSize - 1);
            if (error) throw error;
            if (data.length === 0) break;
            for (const row of data) {
              const location = router.buildLocation({ to: "/cursos/$slug", params: { slug: row.slug }, search: () => ({}), hash: "" });
              const path = sitemapPathForLocation(router, location, "/cursos/$slug");
              if (path) entries.push({ path });
            }
            offset += data.length;
          }
        }

        if (entries.length === 0) {
          return new Response("No pages are included in this sitemap.", { status: 404, headers: { "Cache-Control": "no-store" } });
        }
        return new Response(sitemapXML(BASE_URL, entries), {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
