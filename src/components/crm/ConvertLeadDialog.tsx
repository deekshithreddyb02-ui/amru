import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  service_needed: string | null;
};

type Props = {
  workspaceId: string;
  lead: Lead | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
};

const ConvertLeadDialog = ({ workspaceId, lead, open, onOpenChange, onDone }: Props) => {
  const [orgName, setOrgName] = useState("");
  const [createOrg, setCreateOrg] = useState(true);
  const [dealTitle, setDealTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // Reset state when dialog opens with a fresh lead
  const handleOpen = (v: boolean) => {
    if (v && lead) {
      setOrgName("");
      setCreateOrg(true);
      setDealTitle(`${lead.service_needed || "Project"} — ${lead.full_name}`);
      setAmount("");
    }
    onOpenChange(v);
  };

  const handleConvert = async () => {
    if (!lead) return;
    if (!dealTitle.trim()) {
      toast.error("Deal title is required");
      return;
    }
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id ?? null;

      let organization_id: string | null = null;
      if (createOrg && orgName.trim()) {
        const { data: org, error: orgErr } = await supabase
          .from("crm_organizations")
          .insert({
            workspace_id: workspaceId,
            name: orgName.trim(),
            city: lead.city,
            state: lead.state,
            created_by: uid,
          })
          .select("id")
          .single();
        if (orgErr) throw orgErr;
        organization_id = org.id;
      }

      // Create contact
      const { data: contact, error: contactErr } = await supabase
        .from("crm_contacts")
        .insert({
          workspace_id: workspaceId,
          full_name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          city: lead.city,
          state: lead.state,
          organization_id,
          created_by: uid,
        })
        .select("id")
        .single();
      if (contactErr) throw contactErr;

      // Create deal
      const { error: dealErr } = await supabase.from("crm_deals").insert({
        workspace_id: workspaceId,
        title: dealTitle.trim(),
        amount: amount ? Number(amount) : 0,
        stage: "qualified",
        probability: 30,
        contact_id: contact.id,
        organization_id,
        lead_id: lead.id,
        owner_id: uid,
        created_by: uid,
      });
      if (dealErr) throw dealErr;

      // Mark lead as qualified
      await supabase.from("crm_leads").update({ stage: "qualified", status: "open" }).eq("id", lead.id);

      toast.success("Lead converted to Contact + Deal");
      onOpenChange(false);
      onDone?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Conversion failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Convert lead
          </DialogTitle>
        </DialogHeader>

        {lead && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="font-medium">{lead.full_name}</div>
              <div className="text-xs text-muted-foreground">
                {lead.email || "—"} · {lead.phone || "—"}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Also create an Organization</Label>
              <Switch checked={createOrg} onCheckedChange={setCreateOrg} />
            </div>
            {createOrg && (
              <div className="space-y-1.5">
                <Label>Organization name</Label>
                <Input
                  placeholder="Acme Pvt Ltd"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Deal title *</Label>
              <Input value={dealTitle} onChange={(e) => setDealTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Deal amount (INR)</Label>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConvert} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Convert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConvertLeadDialog;
