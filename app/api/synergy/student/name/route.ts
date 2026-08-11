import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client }) => {
  const data = (await client.getChildList()) as {
    userFormattedName?: string;
    childrenList?: Array<{ childName?: string }>;
  };
  const name =
    data?.childrenList?.[0]?.childName || data?.userFormattedName || "";
  return { name };
});
