import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(
  async ({ client, body }) => {
    await client.markMailRead(
      String(body.sm_msg_person_gu),
      Boolean(body.mark_as_unread),
    );
    return { success: true };
  },
  { required: ["sm_msg_person_gu"] },
);
