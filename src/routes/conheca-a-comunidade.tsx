import { createFileRoute, redirect } from "@tanstack/react-router";

// Endereço antigo da página pública de comunidades — redireciona para a nova URL.
export const Route = createFileRoute("/conheca-a-comunidade")({
  staticData: { sitemap: false },
  beforeLoad: () => {
    throw redirect({ to: "/comunidades", replace: true });
  },
  component: () => null,
});
