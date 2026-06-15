// fyi that this feature is not commonly used by most teachers/districts.
import { synergyRoute, unwrapKey } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client }) => {
  const raw = await client.call("StudentClassNotes");
  return unwrapKey(raw, "StudentClassNotes");
});
