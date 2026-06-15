import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(
  ({ client, body }) => client.getCalendarDay(String(body.date)),
  { required: ["date"] },
);
