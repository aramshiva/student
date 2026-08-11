import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(({ client, body }) =>
  client.getSchedule(
    body.term_index != null ? Number(body.term_index) : undefined,
  ),
);
