import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help | TRIFAIR" },
      { name: "description", content: "Answers to common questions about TRIFAIR." },
      { property: "og:title", content: "Help | TRIFAIR" },
      { property: "og:description", content: "Answers to common questions about TRIFAIR." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PagePlaceholder page="help" />;
}
