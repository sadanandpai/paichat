import type { Metadata } from "next";
import { RagForm } from "@/components/admin-form/form";
import { loadTools } from "@/app/admin/actions";
import { requireAdmin } from "@/app/admin/guard";
import { TOOL_IDS, type ToolDataMap } from "@/lib/tools/catalog";

export const metadata: Metadata = {
  title: "Tools",
};

const emptyData = Object.fromEntries(
  TOOL_IDS.map((id) => [id, ""]),
) as ToolDataMap;

export default async function AdminPage() {
  await requireAdmin();
  const initial = await loadTools();

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-8">
      <RagForm
        initialData={initial.ok ? initial.data : emptyData}
        loadError={initial.ok ? undefined : initial.error}
      />
    </main>
  );
}
