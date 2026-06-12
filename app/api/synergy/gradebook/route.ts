import { synergyRoute, unwrapKey } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client, body }) => {
  const params =
    body.reportPeriod != null ? { ReportPeriod: body.reportPeriod } : {};
  const raw = await client.call("Gradebook", params);
  return unwrapKey(raw, "Gradebook");
});
