import { createFileRoute } from "@tanstack/react-router";
import { handleAssistant } from "@/lib/assistant.server";

export const Route = createFileRoute("/api/assistant")({
  staticData: { sitemap: false },
  server: { handlers: { POST: ({ request }) => handleAssistant(request) } },
});
