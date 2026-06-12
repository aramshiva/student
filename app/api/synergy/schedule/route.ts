import { synergyRoute, unwrapKey } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client, body }) => {
  const params: Record<string, unknown> = { childIntID: 0 };
  if (body.term_index != null) params.TermIndex = Number(body.term_index);
  else if (body.reportPeriod != null) params.ReportPeriod = body.reportPeriod;

  const raw = await client.call("StudentClassList", params);
  return unwrapKey(raw, "StudentClassList");
});
