import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy | TRIFAIR" },
      { name: "description", content: "How the TRIFAIR demo handles your data." },
      { property: "og:title", content: "Privacy | TRIFAIR" },
      { property: "og:description", content: "How the TRIFAIR demo handles your data." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PagePlaceholder page="privacy" />;
}
