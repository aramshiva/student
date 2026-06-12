import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client, body }) => {
  const folder = String(body.folder ?? "Inbox");
  const mailRoot = (await client.getMailFolderData(folder)) as Record<
    string,
    unknown
  >;

  const listingsKey =
    folder === "Archive" ? "ArchiveItemListings" : "InboxItemListings";
  const listings = mailRoot?.[listingsKey] as
    | Record<string, unknown>
    | undefined;
  const rawMessages = listings?.MessageXML;
  const messages: Record<string, unknown>[] = rawMessages
    ? Array.isArray(rawMessages)
      ? (rawMessages as Record<string, unknown>[])
      : [rawMessages as Record<string, unknown>]
    : [];

  const guids = messages
    .map((m) => m._SMMessageGU)
    .filter((g): g is string => typeof g === "string" && g.length > 0);

  const bodyMap = await client.getMailBodies(guids);
  for (const m of messages) {
    const guid = m._SMMessageGU;
    if (typeof guid === "string" && bodyMap.has(guid)) {
      m._MessageText = bodyMap.get(guid);
    }
  }

  return { messages };
});
