import { synergyRoute } from "@/lib/synergyRoute";
import { parseStudentPage } from "@/lib/studentPage";

export const runtime = "nodejs";

// scraped from the PXP2 portal page, which carries fields GetStudentInfoData
// (see /api/synergy/student) leaves blank for most districts
export const POST = synergyRoute(async ({ client }) => {
  const html = await client.getWebPage("PXP2_Student.aspx?AGU=0");
  return parseStudentPage(html);
});
