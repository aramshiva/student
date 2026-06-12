import { synergyRoute } from "@/lib/synergyRoute";

export const runtime = "nodejs";

export const POST = synergyRoute(
  ({ client, body }) => client.getReportCard(String(body.document_guid)),
  { required: ["document_guid"] },
);
