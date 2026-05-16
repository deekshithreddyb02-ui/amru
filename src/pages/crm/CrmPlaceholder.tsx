import { useOutletContext } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CrmWorkspace } from "@/hooks/useCrmWorkspaces";

type Ctx = { workspace: CrmWorkspace; myRole: string };

const CrmPlaceholder = ({ title, phase }: { title: string; phase: string }) => {
  const { workspace } = useOutletContext<Ctx>();
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-serif">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming in {phase}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {title} for <strong>{workspace.name}</strong> will be built in {phase}. Phase 1 ships
          workspaces, RBAC, leads pipeline, and the website→CRM mirror.
        </CardContent>
      </Card>
    </div>
  );
};

export const CrmDeals = () => <CrmPlaceholder title="Deals" phase="Phase 2" />;
export const CrmReports = () => <CrmPlaceholder title="Reports" phase="Phase 5" />;
