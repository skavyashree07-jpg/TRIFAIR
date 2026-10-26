import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Sources | TRIFAIR" },
      { name: "description", content: "Where TRIFAIR's heritage information comes from." },
      { property: "og:title", content: "Sources | TRIFAIR" },
      { property: "og:description", content: "Where TRIFAIR's heritage information comes from." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PagePlaceholder page="sources" />;
}
