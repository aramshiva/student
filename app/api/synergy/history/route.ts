import { synergyRoute } from "@/lib/synergyRoute";
import { fetchStudentVue } from "@/lib/courseHistory";

export const runtime = "nodejs";

export const POST = synergyRoute(({ body, domain }) =>
  fetchStudentVue({
    districtUrl: `https://${domain}`,
    username: String(body.username),
    password: String(body.password),
    timeoutMs:
      typeof body.timeout_ms === "number"
        ? body.timeout_ms
        : Number(body.timeout_ms) || undefined,
  }),
);
