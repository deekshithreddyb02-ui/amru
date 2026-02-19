import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Loader2, Save } from "lucide-react";

const LegalNoticeEditor = () => {
  const { toast } = useToast();
  const { data, loading, updateContent } = useSiteContent("legal_notice");
  const [saving, setSaving] = useState(false);

  const meta = (data?.metadata as Record<string, string>) || {};

  const [title, setTitle] = useState("");
  const [copyrightLine, setCopyrightLine] = useState("");
  const [companyNote, setCompanyNote] = useState("");
  const [content, setContent] = useState("");
  const [disclaimer, setDisclaimer] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (!loading && data && !initialized) {
    setTitle(data.title || "");
    setContent(data.content || "");
    setCopyrightLine(meta.copyright_line || "");
    setCompanyNote(meta.company_note || "");
    setDisclaimer(meta.disclaimer || "");
    setInitialized(true);
  }

  const handleSave = async () => {
    setSaving(true);
    const result = await updateContent({
      title,
      content,
      metadata: { copyright_line: copyrightLine, company_note: companyNote, disclaimer },
    });
    setSaving(false);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Legal notice updated" });
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal Notice Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <Label>Section Title</Label>
          <Input value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Copyright Line</Label>
          <Input value={copyrightLine} onChange={e => setCopyrightLine(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Company Note</Label>
          <Input value={companyNote} onChange={e => setCompanyNote(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Main Content</Label>
          <Textarea value={content} onChange={e => setContent(e.target.value)} rows={5} />
        </div>
        <div className="space-y-1">
          <Label>Disclaimer</Label>
          <Textarea value={disclaimer} onChange={e => setDisclaimer(e.target.value)} rows={2} />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};

export default LegalNoticeEditor;
