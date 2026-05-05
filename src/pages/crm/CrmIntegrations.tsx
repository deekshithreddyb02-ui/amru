import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, MessageSquare, Slack, Webhook, ExternalLink, CheckCircle2 } from "lucide-react";
import { Link2 } from "lucide-react";

const INTEGRATIONS = [
  {
    id: "google-calendar", name: "Google Calendar", icon: Calendar,
    desc: "Two-way sync of CRM meetings and activities with Google Calendar.",
    docs: "https://developers.google.com/calendar",
    status: "available",
  },
  {
    id: "gmail", name: "Gmail", icon: Mail,
    desc: "Read, send and thread customer emails directly on lead/deal records.",
    docs: "https://developers.google.com/gmail/api",
    status: "available",
  },
  {
    id: "outlook", name: "Microsoft Outlook", icon: Mail,
    desc: "Sync emails and meetings from Outlook 365 to CRM records.",
    docs: "https://learn.microsoft.com/graph/outlook-mail-concept-overview",
    status: "available",
  },
  {
    id: "slack", name: "Slack", icon: Slack,
    desc: "Push lead/deal/ticket events into Slack channels and DMs.",
    docs: "https://api.slack.com",
    status: "available",
  },
  {
    id: "teams", name: "Microsoft Teams", icon: MessageSquare,
    desc: "Send CRM notifications and SLA breach alerts to Teams channels.",
    docs: "https://learn.microsoft.com/microsoftteams/platform/",
    status: "available",
  },
  {
    id: "webhooks", name: "Webhooks", icon: Webhook,
    desc: "Subscribe external systems to CRM events (lead.created, deal.won, …).",
    status: "coming_soon",
  },
];

export default function CrmIntegrations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif flex items-center gap-2"><Link2 className="h-6 w-6 text-primary" /> Integrations</h1>
        <p className="text-sm text-muted-foreground">Connect CRM with email, calendar and chat. Use the project Connectors page to grant access.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRATIONS.map(i => (
          <Card key={i.id} className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><i.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <div className="font-semibold">{i.name}</div>
                  {i.status === "available"
                    ? <Badge variant="outline" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Available</Badge>
                    : <Badge variant="secondary" className="text-xs">Coming soon</Badge>}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{i.desc}</p>
            <div className="flex gap-2">
              {i.docs && <Button asChild size="sm" variant="outline"><a href={i.docs} target="_blank" rel="noreferrer">Docs <ExternalLink className="h-3 w-3 ml-1" /></a></Button>}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5 space-y-2">
        <h2 className="font-semibold">How to connect</h2>
        <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
          <li>Open <strong>Connectors</strong> from the project sidebar.</li>
          <li>Pick the service (Google Calendar, Gmail, Slack…) and authorize.</li>
          <li>Once linked, related CRM modules (Calendar, Activity Feed, Notifications) will start using it automatically.</li>
        </ol>
      </Card>
    </div>
  );
}
