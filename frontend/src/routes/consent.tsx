import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/consent")({
  head: () => ({
    meta: [
      { title: "Consent | TRIFAIR" },
      { name: "description", content: "How artisan and community consent works on TRIFAIR." },
      { property: "og:title", content: "Consent | TRIFAIR" },
      {
        property: "og:description",
        content: "How artisan and community consent works on TRIFAIR.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return <PagePlaceholder page="consent" />;
}
