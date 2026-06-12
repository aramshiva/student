import { synergyRoute, unwrapKey } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client, body }) => {
  const params: Record<string, unknown> = { childIntID: 0 };
  if (body.request_date) params.RequestDate = String(body.request_date);

  const raw = await client.call("StudentSchoolInfo", params);
  return unwrapKey(raw, "StudentSchoolInfo");
});
