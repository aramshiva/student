import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(
  ({ client, body }) =>
    client.getMailRecipient(
      String(body.staff_gu),
      String(body.staff_name ?? ""),
      String(body.staff_type ?? ""),
    ),
  { required: ["staff_gu"] },
);
