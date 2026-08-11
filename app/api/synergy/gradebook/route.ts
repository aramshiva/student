import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(({ client, body }) =>
  client.getGradebook(
    body.reportPeriod != null ? Number(body.reportPeriod) : undefined,
  ),
);
