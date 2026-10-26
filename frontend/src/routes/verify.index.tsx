import { createFileRoute } from "@tanstack/react-router";
import { VerificationView } from "@/components/verify/VerificationView";

export const Route = createFileRoute("/verify/")({
  head: () => ({
    meta: [
      { title: "Verify Craft Origin | TRIFAIR" },
      { name: "description", content: "Check a craft's origin using its QR provenance code." },
      { property: "og:title", content: "Verify Craft Origin | TRIFAIR" },
      {
        property: "og:description",
        content: "Check a craft's origin using its QR provenance code.",
      },
    ],
  }),
  component: VerifyIndexPage,
});

export function VerifyIndexPage() {
  return <VerificationView />;
}
