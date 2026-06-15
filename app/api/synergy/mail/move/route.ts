// inbox is folder_type "0" or "Inbox"
import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(
  async ({ client, body }) => {
    await client.moveMailToFolder(
      String(body.sm_msg_person_gu),
      String(body.folder_type ?? "3"),
      String(body.folder_name ?? "Archive"),
    );
    return { success: true };
  },
  { required: ["sm_msg_person_gu"] },
);
