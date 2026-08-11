import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client, body }) => {
  const folder = String(body.folder ?? "Inbox");
  const mailRoot = (await client.getMailFolderData(folder)) as Record<
    string,
    unknown
  >;

  const listingsKey =
    folder === "Archive" ? "archiveItemListings" : "inboxItemListings";
  const messages = (mailRoot?.[listingsKey] as Record<string, unknown>[]) ?? [];

  return { messages };
});
