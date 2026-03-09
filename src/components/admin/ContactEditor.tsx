import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Loader2, Save, Edit2, X, Plus, Trash2, Phone } from "lucide-react";

interface OfficeContact {
  city: string;
  phone: string;
  whatsapp: string;
  email: string;
}

interface ContactDetails {
  phones: string[];
  emails: string[];
  offices: OfficeContact[];
}

const defaultContacts: ContactDetails = {
  phones: ["+91-741-0030-418", "+91-741-0030-417"],
  emails: ["rain@amrutawater.com"],
  offices: [
    { city: "Pune", phone: "+91-741-0030-418", whatsapp: "917410030418", email: "rain@amrutawater.com" },
    { city: "Hyderabad", phone: "+91-741-0030-417", whatsapp: "917410030417", email: "rain@amrutawater.com" },
    { city: "Mumbai", phone: "+91-741-0030-418", whatsapp: "917410030418", email: "rain@amrutawater.com" },
    { city: "Bangalore", phone: "+91-741-0030-417", whatsapp: "917410030417", email: "rain@amrutawater.com" },
  ],
};

const ContactEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contacts, setContacts] = useState<ContactDetails>(defaultContacts);
  const [editData, setEditData] = useState<ContactDetails>(defaultContacts);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, metadata")
        .in("section_key", ["contact_details", "offices"]);

      if (error) throw error;

      const contactMeta = (data?.find((row) => row.section_key === "contact_details")?.metadata || {}) as Record<string, any>;
      const officeMeta = (data?.find((row) => row.section_key === "offices")?.metadata || {}) as Record<string, any>;

      const fallbackOfficeContacts: OfficeContact[] = Array.isArray(officeMeta?.offices)
        ? officeMeta.offices.map((office: any) => ({
            city: office.city || "",
            phone: office.phone || "",
            whatsapp: office.whatsapp || "",
            email: office.email || "",
          }))
        : defaultContacts.offices;

      const merged: ContactDetails = {
        phones: Array.isArray(contactMeta.phones) && contactMeta.phones.length > 0 ? contactMeta.phones : defaultContacts.phones,
        emails: Array.isArray(contactMeta.emails) && contactMeta.emails.length > 0 ? contactMeta.emails : defaultContacts.emails,
        offices:
          Array.isArray(contactMeta.offices) && contactMeta.offices.length > 0
            ? contactMeta.offices
            : fallbackOfficeContacts,
      };

      setContacts(merged);
      setEditData(merged);
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditData({ ...contacts, offices: [...contacts.offices] });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditData({ ...contacts, offices: [...contacts.offices] });
    setIsEditing(false);
  };

  const saveContacts = async () => {
    setSaving(true);
    try {
      const payload: ContactDetails = {
        phones: editData.phones.map((p) => p.trim()).filter(Boolean),
        emails: editData.emails.map((e) => e.trim()).filter(Boolean),
        offices: editData.offices
          .map((office) => ({
            city: office.city.trim(),
            phone: office.phone.trim(),
            whatsapp: office.whatsapp.trim(),
            email: office.email.trim(),
          }))
          .filter((office) => office.city),
      };

      const { data: existing, error: findError } = await supabase
        .from("site_content")
        .select("id")
        .eq("section_key", "contact_details")
        .maybeSingle();

      if (findError) throw findError;

      if (existing?.id) {
        const { error } = await supabase
          .from("site_content")
          .update({ metadata: payload as any, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_content")
          .insert({ section_key: "contact_details", metadata: payload as any });
        if (error) throw error;
      }

      setContacts(payload);
      setEditData(payload);
      setIsEditing(false);
      toast({ title: "Saved", description: "Contact settings updated" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const updateOffice = (index: number, field: keyof OfficeContact, value: string) => {
    setEditData((prev) => {
      const offices = [...prev.offices];
      offices[index] = { ...offices[index], [field]: value };
      return { ...prev, offices };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          Contact Settings
        </CardTitle>
        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={cancelEditing} disabled={saving}>
              <X className="w-4 h-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={saveContacts} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={startEditing}>
            <Edit2 className="w-4 h-4 mr-1" /> Edit
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm">Location-wise Contacts</Label>
          {(isEditing ? editData.offices : contacts.offices).map((office, index) => (
            <div key={`${office.city}-${index}`} className="grid md:grid-cols-4 gap-2 p-3 border border-border rounded-lg">
              <Input
                value={office.city}
                onChange={(e) => updateOffice(index, "city", e.target.value)}
                disabled={!isEditing}
                placeholder="City"
              />
              <Input
                value={office.phone}
                onChange={(e) => updateOffice(index, "phone", e.target.value)}
                disabled={!isEditing}
                placeholder="Phone"
              />
              <Input
                value={office.whatsapp}
                onChange={(e) => updateOffice(index, "whatsapp", e.target.value)}
                disabled={!isEditing}
                placeholder="WhatsApp"
              />
              <div className="flex gap-2">
                <Input
                  value={office.email}
                  onChange={(e) => updateOffice(index, "email", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Email"
                />
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditData((prev) => ({ ...prev, offices: prev.offices.filter((_, i) => i !== index) }))}
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setEditData((prev) => ({
                  ...prev,
                  offices: [...prev.offices, { city: "", phone: "", whatsapp: "", email: "" }],
                }))
              }
            >
              <Plus className="w-4 h-4 mr-1" /> Add Location Contact
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactEditor;
