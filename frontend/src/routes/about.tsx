import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | TRIFAIR" },
      { name: "description", content: "How NGOs run TRIFAIR on behalf of tribal artisans." },
      { property: "og:title", content: "About | TRIFAIR" },
      { property: "og:description", content: "How NGOs run TRIFAIR on behalf of tribal artisans." },
    ],
  }),
  component: Page,
});

function Page() {
  return <PagePlaceholder page="about" />;
}
