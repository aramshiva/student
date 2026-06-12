import { synergyRoute } from "@/lib/synergyRoute";
import { getStudentSummaryFromDistrict } from "@/lib/name";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ body, domain }) => {
  const data = await getStudentSummaryFromDistrict({
    districtBase: `https://${domain}`,
    userId: String(body.username),
    password: String(body.password),
  });
  if (!data) throw new Error("Failed to fetch student summary");
  return data;
});
