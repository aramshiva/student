// fyi that this feature is not commonly used by most teachers/districts.
import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(({ client }) => client.getClassNotes());
