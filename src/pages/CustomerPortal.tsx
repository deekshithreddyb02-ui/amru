import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText, Receipt, FileCheck2 } from "lucide-react";

type PortalData = {
  ok: boolean;
  error?: string;
  customer?: { name?: string; email?: string };
  scope?: string;
  expires_at?: string | null;
  invoices?: any[];
  quotations?: any[];
  reports?: any[];
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

export default function CustomerPortal() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    fetch(
      `https://${projectId}.supabase.co/functions/v1/crm-portal-resolve?token=${encodeURIComponent(token)}`,
    )
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setData({ ok: false, error: String(e) }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="min-h-screen grid place-items-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Access denied</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {data?.error || "This share link is invalid, expired, or has been revoked."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { customer, invoices = [], quotations = [], reports = [] } = data;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Customer Portal</h1>
            <p className="text-xs text-muted-foreground">Amrutha Hydro Geo Services</p>
          </div>
          {customer?.name && (
            <div className="text-right text-sm">
              <div className="font-medium">{customer.name}</div>
              {customer.email && <div className="text-muted-foreground text-xs">{customer.email}</div>}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" /> Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices to display.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="py-2 pr-3">Number</th><th>Issue date</th><th>Due</th><th>Status</th><th className="text-right">Total</th><th className="text-right">Paid</th></tr>
                  </thead>
                  <tbody>
                    {invoices.map((i) => (
                      <tr key={i.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-mono">{i.invoice_number}</td>
                        <td>{i.issue_date}</td>
                        <td>{i.due_date || "—"}</td>
                        <td><Badge variant={i.status === "paid" ? "default" : i.status === "overdue" ? "destructive" : "secondary"}>{i.status}</Badge></td>
                        <td className="text-right">{inr(Number(i.total))}</td>
                        <td className="text-right">{inr(Number(i.paid_amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Quotations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quotations to display.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground border-b">
                    <tr><th className="py-2 pr-3">Number</th><th>Issue date</th><th>Valid until</th><th>Status</th><th className="text-right">Total</th></tr>
                  </thead>
                  <tbody>
                    {quotations.map((q) => (
                      <tr key={q.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-mono">{q.quotation_number}</td>
                        <td>{q.issue_date}</td>
                        <td>{q.valid_until || "—"}</td>
                        <td><Badge variant="secondary">{q.status}</Badge></td>
                        <td className="text-right">{inr(Number(q.total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-primary" /> Project reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shared reports yet.</p>
            ) : (
              <ul className="divide-y">
                {reports.map((r) => (
                  <li key={r.id} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground">v{r.current_version} · {r.status}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.sent_to_customer_at ? `Sent ${new Date(r.sent_to_customer_at).toLocaleDateString()}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {data.expires_at && (
          <p className="text-xs text-center text-muted-foreground">
            This link expires on {new Date(data.expires_at).toLocaleString()}
          </p>
        )}
      </main>
    </div>
  );
}
