import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client }) => {
  const account = (await client.getMyAccount()) as Record<string, unknown>;
  return {
    name: account.formattedName ?? null,
    userID: account.userID ?? null,
    email: account.eMail ?? null,
    homeAddress: account.homeAddress ?? null,
    // yes. edupoint cant even spell addresses...
    mailAddress: account.mailAddreess ?? account.mailAddress ?? null,
  };
});
