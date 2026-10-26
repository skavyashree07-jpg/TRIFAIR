import { createFileRoute } from "@tanstack/react-router";
import { VerificationView } from "@/components/verify/VerificationView";

export const Route = createFileRoute("/verify/$token")({
  head: () => ({
    meta: [
      { title: "Verification Result | TRIFAIR" },
      {
        name: "description",
        content: "See whether a craft is traced to a verified artisan and NGO.",
      },
      { property: "og:title", content: "Verification Result | TRIFAIR" },
      {
        property: "og:description",
        content: "See whether a craft is traced to a verified artisan and NGO.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyTokenPage,
});

export function VerifyTokenPage() {
  const { token } = Route.useParams();
  return <VerificationView initialToken={token} />;
}
