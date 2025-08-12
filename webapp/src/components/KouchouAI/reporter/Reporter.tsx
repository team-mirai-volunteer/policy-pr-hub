import type { Meta } from "@/type";
import { ReporterContent } from "./ReporterContent";

export function Reporter({ meta }: { meta: Meta }) {
  return (
    <ReporterContent meta={meta}>
      {/* Reporter image disabled - no image available */}
    </ReporterContent>
  );
}
