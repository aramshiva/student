import { synergyRoute } from "@/lib/synergyRoute";
import { getStudentNameFromDistrict } from "@/lib/name";

export const runtime = "nodejs";

export const POST = synergyRoute(async ({ body, domain }) => {
  const name = await getStudentNameFromDistrict({
    districtBase: `https://${domain}`,
    userId: String(body.username),
    password: String(body.password),
  });
  return { name };
});
