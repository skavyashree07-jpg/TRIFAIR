import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/methodology")({
  head: () => ({ meta: [
    { title: "Methodology | TRIFAIR" },
    { name: "description", content: "How TRIFAIR handles pricing, provenance, consent, and sample data." },
  ] }),
  component: MethodologyPage,
});
function MethodologyPage() { return <PagePlaceholder page="methodology" />; }
