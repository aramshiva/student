import { synergyRoute } from "@/lib/synergyRoute";
import { getTestAnalysis } from "@/lib/testAnalysis";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ body, domain }) => {
  const analysis = await getTestAnalysis({
    districtBase: `https://${domain}`,
    userId: String(body.username),
    password: String(body.password),
  });
  return { analysis };
});
