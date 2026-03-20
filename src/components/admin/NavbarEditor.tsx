import { useState, useEffect, useRef } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { Loader2, Plus, Trash2, GripVertical, Save, ExternalLink, Upload } from "lucide-react";

interface NavLink {
  name: string;
  href: string;
}

interface ExternalLink {
  name: string;
  url: string;
}

interface NavbarMetadata {
  company_name: string;
  logo_url: string;
  nav_links: NavLink[];
  external_link: ExternalLink;
}

const NavbarEditor = () => {
  const { data, loading, updateContent } = useSiteContent("navbar");
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [externalLink, setExternalLink] = useState<ExternalLink>({ name: "", url: "" });

  useEffect(() => {
    if (data?.metadata) {
      const meta = data.metadata as unknown as NavbarMetadata;
      setCompanyName(meta.company_name || "");
      setLogoUrl(meta.logo_url || "");
      setNavLinks(meta.nav_links || []);
      setExternalLink(meta.external_link || { name: "", url: "" });
    }
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const metadata = {
        company_name: companyName,
        logo_url: logoUrl,
        nav_links: navLinks,
        external_link: externalLink,
      };
      const result = await updateContent({ metadata: metadata as any });
      if (result.error) throw new Error(result.error);
      toast({ title: "Saved", description: "Navbar settings updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file", description: "Please upload a PNG, JPG, WebP, or SVG image.", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Logo must be under 2 MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `branding/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("main").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("main").getPublicUrl(path);
      setLogoUrl(urlData.publicUrl);
      toast({ title: "Uploaded", description: "Logo uploaded. Don't forget to save!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: sanitizeError(err), variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addNavLink = () => {
    setNavLinks([...navLinks, { name: "", href: "#" }]);
  };

  const removeNavLink = (index: number) => {
    setNavLinks(navLinks.filter((_, i) => i !== index));
  };

  const updateNavLink = (index: number, field: keyof NavLink, value: string) => {
    const updated = [...navLinks];
    updated[index] = { ...updated[index], [field]: value };
    setNavLinks(updated);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company-name">Company Name</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name displayed in navbar"
            />
          </div>
          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-2 mt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                Upload Logo
              </Button>
              <span className="text-xs text-muted-foreground">or paste URL below</span>
            </div>
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="mt-2"
            />
            {logoUrl && (
              <div className="mt-2 flex items-center gap-3">
                <img src={logoUrl} alt="Logo preview" className="w-12 h-12 object-contain rounded-full bg-muted" />
                <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl("")} className="text-destructive text-xs">
                  <Trash2 className="w-3 h-3 mr-1" /> Remove
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Navigation Links</CardTitle>
          <Button size="sm" variant="outline" onClick={addNavLink}>
            <Plus className="w-4 h-4 mr-1" />
            Add Link
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {navLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                value={link.name}
                onChange={(e) => updateNavLink(index, "name", e.target.value)}
                placeholder="Link name"
                className="flex-1"
              />
              <Input
                value={link.href}
                onChange={(e) => updateNavLink(index, "href", e.target.value)}
                placeholder="#section or /page"
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeNavLink(index)}
                className="flex-shrink-0"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
          {navLinks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No navigation links. Add one above.</p>
          )}
        </CardContent>
      </Card>

      {/* External Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            External Link Button
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ext-name">Button Text</Label>
            <Input
              id="ext-name"
              value={externalLink.name}
              onChange={(e) => setExternalLink({ ...externalLink, name: e.target.value })}
              placeholder="Button label"
            />
          </div>
          <div>
            <Label htmlFor="ext-url">Button URL</Label>
            <Input
              id="ext-url"
              value={externalLink.url}
              onChange={(e) => setExternalLink({ ...externalLink, url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Navbar Settings
        </Button>
      </div>
    </div>
  );
};

export default NavbarEditor;
