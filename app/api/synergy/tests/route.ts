import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ client }) => {
  const analysis = await client.getTestAnalysis();
  return { analysis };
});
