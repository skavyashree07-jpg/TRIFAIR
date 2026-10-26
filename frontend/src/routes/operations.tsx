import { createFileRoute } from "@tanstack/react-router";
import OperationsApp from "../operations/OperationsApp";

export const Route = createFileRoute("/operations")({
  head: () => ({ meta: [{ title: "Operations | TRIFAIR" }] }),
  component: OperationsPage,
});

function OperationsPage() {
  return (
    <div className="trifair-operations">
      <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-100 p-3 text-sm text-amber-950">
        Sample data and demo only. No real payments. Independent student project. Operations screens are currently a local demo; use the authenticated API for persisted operations.
      </p>
      <OperationsApp />
    </div>
  );
}
