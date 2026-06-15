import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client }) => {
  const account = (await client.getMyAccount()) as Record<string, unknown>;
  return {
    name: account._FormattedName ?? null,
    userID: account._UserID ?? null,
    email: account._EMail ?? null,
    homeAddress: account._HomeAddress ?? null,
    // yes. edupoint cant even spell addresses...
    mailAddress: account._MailAddreess ?? account._MailAddress ?? null,
  };
});
