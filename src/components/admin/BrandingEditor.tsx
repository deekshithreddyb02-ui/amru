import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import {
  Loader2, Save, Upload, Trash2, Info, Image as ImageIcon,
  Monitor, Smartphone, Moon, Sun, Globe, RotateCcw, CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import defaultLogo from "@/assets/logo-small.webp";

// ─── Types ──────────────────────────────────────────
interface LogoSlot {
  key: string;
  label: string;
  description: string;
  icon: typeof Sun;
  formats: string;
  recommended: string;
  maxSize: string;
  required: boolean;
}

interface BrandingData {
  primary_logo: string;
  dark_logo: string;
  light_logo: string;
  favicon: string;
  mobile_logo: string;
  company_name: string;
}

const LOGO_SLOTS: LogoSlot[] = [
  {
    key: "primary_logo",
    label: "Primary Logo",
    description: "Default logo used across the platform — navbar, footer, splash screen, chatbot.",
    icon: Globe,
    formats: "PNG, SVG, WebP",
    recommended: "200×200px, transparent background",
    maxSize: "2 MB",
    required: true,
  },
  {
    key: "dark_logo",
    label: "Dark Mode Logo",
    description: "Logo variant optimized for dark backgrounds. Falls back to primary if not set.",
    icon: Moon,
    formats: "PNG, SVG, WebP",
    recommended: "200×200px, light-colored, transparent background",
    maxSize: "2 MB",
    required: false,
  },
  {
    key: "light_logo",
    label: "Light Mode Logo",
    description: "Logo variant for light backgrounds. Falls back to primary if not set.",
    icon: Sun,
    formats: "PNG, SVG, WebP",
    recommended: "200×200px, dark-colored, transparent background",
    maxSize: "2 MB",
    required: false,
  },
  {
    key: "favicon",
    label: "Favicon",
    description: "Browser tab icon. Appears in bookmarks and tab bar.",
    icon: Monitor,
    formats: "PNG, ICO, SVG",
    recommended: "32×32px or 64×64px, square",
    maxSize: "512 KB",
    required: false,
  },
  {
    key: "mobile_logo",
    label: "Mobile Logo",
    description: "Compact logo for mobile navigation. Falls back to primary if not set.",
    icon: Smartphone,
    formats: "PNG, SVG, WebP",
    recommended: "120×120px, transparent background",
    maxSize: "1 MB",
    required: false,
  },
];

const ACCEPTED_TYPES: Record<string, string[]> = {
  primary_logo: ["image/png", "image/svg+xml", "image/webp"],
  dark_logo: ["image/png", "image/svg+xml", "image/webp"],
  light_logo: ["image/png", "image/svg+xml", "image/webp"],
  favicon: ["image/png", "image/x-icon", "image/svg+xml", "image/vnd.microsoft.icon"],
  mobile_logo: ["image/png", "image/svg+xml", "image/webp"],
};

const MAX_SIZES: Record<string, number> = {
  primary_logo: 2 * 1024 * 1024,
  dark_logo: 2 * 1024 * 1024,
  light_logo: 2 * 1024 * 1024,
  favicon: 512 * 1024,
  mobile_logo: 1 * 1024 * 1024,
};

const ACCEPT_STRINGS: Record<string, string> = {
  primary_logo: "image/png,image/svg+xml,image/webp",
  dark_logo: "image/png,image/svg+xml,image/webp",
  light_logo: "image/png,image/svg+xml,image/webp",
  favicon: "image/png,image/x-icon,image/svg+xml",
  mobile_logo: "image/png,image/svg+xml,image/webp",
};

const DEFAULT_DATA: BrandingData = {
  primary_logo: "",
  dark_logo: "",
  light_logo: "",
  favicon: "",
  mobile_logo: "",
  company_name: "Amruta Integrated Water Solutions Pvt. Ltd.",
};

// ─── Component ──────────────────────────────────────
const BrandingEditor = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [data, setData] = useState<BrandingData>(DEFAULT_DATA);
  const [id, setId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    setLoading(true);
    try {
      const { data: row, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("section_key", "branding")
        .maybeSingle();
      if (error) throw error;
      if (row) {
        setId(row.id);
        const meta = row.metadata as unknown as Partial<BrandingData>;
        setData({ ...DEFAULT_DATA, ...meta });
      }
    } catch (err: any) {
      toast({ title: "Error", description: sanitizeError(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const metadata = { ...data } as unknown as import("@/integrations/supabase/types").Json;
      const payload = { metadata, updated_at: new Date().toISOString() };
      if (id) {
        const { error } = await supabase.from("site_content").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("site_content")
          .insert([{ section_key: "branding" as any, ...payload }]);
        if (error) throw error;
      }
      toast({ title: "Saved", description: "Branding assets updated across all sections" });
      await fetchBranding();
    } catch (err: any) {
      toast({ title: "Error", description: sanitizeError(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (slotKey: string, file: File) => {
    // Validate type
    if (!ACCEPTED_TYPES[slotKey]?.includes(file.type)) {
      toast({
        title: "Invalid format",
        description: `Please upload ${LOGO_SLOTS.find(s => s.key === slotKey)?.formats}`,
        variant: "destructive",
      });
      return;
    }
    // Validate size
    if (file.size > (MAX_SIZES[slotKey] || 2 * 1024 * 1024)) {
      toast({
        title: "File too large",
        description: `Maximum size: ${LOGO_SLOTS.find(s => s.key === slotKey)?.maxSize}`,
        variant: "destructive",
      });
      return;
    }

    setUploading(slotKey);
    try {
      const ext = file.name.split(".").pop();
      const path = `branding/${slotKey}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("main")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("main").getPublicUrl(path);
      setData(prev => ({ ...prev, [slotKey]: urlData.publicUrl }));
      toast({ title: "Uploaded", description: "Don't forget to save your changes!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: sanitizeError(err), variant: "destructive" });
    } finally {
      setUploading(null);
      const input = fileInputRefs.current[slotKey];
      if (input) input.value = "";
    }
  };

  const removeAsset = (slotKey: string) => {
    setData(prev => ({ ...prev, [slotKey]: "" }));
  };

  const resolvedLogo = (key: string): string => {
    return (data as any)[key] || data.primary_logo || defaultLogo;
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
      {/* Info banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Centralized Branding Manager</p>
              <p>
                Upload and manage all logo variants from one place. Changes propagate to the
                Navbar, Footer, Splash Screen, and Chatbot. Use the live preview to verify
                appearance before saving.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* ─── Left: Logo Slots ─── */}
        <div className="space-y-4">
          {/* Company Name */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <Label className="text-sm font-semibold">Company Name</Label>
              <Input
                value={data.company_name}
                onChange={e => setData(prev => ({ ...prev, company_name: e.target.value }))}
                placeholder="Your company name"
                className="mt-2"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Displayed alongside the logo in navigation and footer.
              </p>
            </CardContent>
          </Card>

          {/* Logo Slots */}
          {LOGO_SLOTS.map((slot) => {
            const url = (data as any)[slot.key] as string;
            const isUploading = uploading === slot.key;
            const SlotIcon = slot.icon;

            return (
              <Card key={slot.key} className="overflow-hidden">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-4">
                    {/* Preview thumbnail */}
                    <div className="w-20 h-20 shrink-0 rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden">
                      {url ? (
                        <img
                          src={url}
                          alt={slot.label}
                          className="w-full h-full object-contain p-1"
                          loading="lazy"
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <SlotIcon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-semibold text-foreground">{slot.label}</span>
                        {slot.required && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                            Required
                          </Badge>
                        )}
                        {!slot.required && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Optional
                          </Badge>
                        )}
                        {url && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Set
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {slot.description}
                      </p>

                      {/* Guidelines */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        <span>📐 {slot.recommended}</span>
                        <span>📁 {slot.formats}</span>
                        <span>⚖️ Max {slot.maxSize}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          ref={(el) => { fileInputRefs.current[slot.key] = el; }}
                          type="file"
                          accept={ACCEPT_STRINGS[slot.key]}
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload(slot.key, f);
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[slot.key]?.click()}
                          className="gap-1.5 text-xs h-8"
                        >
                          {isUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          {url ? "Replace" : "Upload"}
                        </Button>
                        {url && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAsset(slot.key)}
                              className="gap-1 text-xs h-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove
                            </Button>
                          </>
                        )}
                      </div>

                      {/* URL input for paste */}
                      <Input
                        value={url}
                        onChange={e => setData(prev => ({ ...prev, [slot.key]: e.target.value }))}
                        placeholder="Or paste image URL..."
                        className="text-xs h-8 mt-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Save */}
          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Branding Assets
          </Button>
        </div>

        {/* ─── Right: Live Preview ─── */}
        <div className="space-y-4">
          <Card className="sticky top-20">
            <CardContent className="pt-5 pb-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Live Preview</span>
                <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-1.5 rounded-md transition-colors ${
                      previewMode === "desktop"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-1.5 rounded-md transition-colors ${
                      previewMode === "mobile"
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navbar preview */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">
                  Navigation Bar
                </span>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ background: "hsl(200 80% 18%)" }}
                >
                  <div className={`flex items-center gap-2.5 ${
                    previewMode === "mobile" ? "px-3 py-2.5" : "px-4 py-3"
                  }`}>
                    <img
                      src={
                        previewMode === "mobile"
                          ? resolvedLogo("mobile_logo")
                          : resolvedLogo("primary_logo")
                      }
                      alt="Nav logo"
                      className={`object-contain rounded-full bg-white ring-2 ring-white/20 ${
                        previewMode === "mobile" ? "w-8 h-8" : "w-10 h-10"
                      }`}
                    />
                    <span
                      className={`text-white font-semibold leading-tight truncate ${
                        previewMode === "mobile" ? "text-xs" : "text-sm"
                      }`}
                      style={{ fontFamily: "var(--font-serif)" }}
                    >
                      {data.company_name || "Company Name"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer preview */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">
                  Footer
                </span>
                <div
                  className="rounded-lg overflow-hidden p-4"
                  style={{ background: "hsl(200 80% 12%)" }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={resolvedLogo("dark_logo")}
                      alt="Footer logo"
                      className="w-12 h-12 object-contain rounded-full bg-white/10 ring-1 ring-white/10"
                    />
                    <div>
                      <p
                        className="text-white text-sm font-semibold"
                        style={{ fontFamily: "var(--font-serif)" }}
                      >
                        {data.company_name || "Company Name"}
                      </p>
                      <p className="text-white/60 text-[10px]">
                        Sustainable Water Solutions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Favicon preview */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">
                  Browser Tab
                </span>
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-center gap-2 bg-background rounded-md px-3 py-2 border border-border">
                    {data.favicon ? (
                      <img
                        src={data.favicon}
                        alt="Favicon"
                        className="w-4 h-4 object-contain"
                      />
                    ) : (
                      <Globe className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-xs text-foreground truncate">
                      {data.company_name || "Amruta Hydrogeo Services"}
                    </span>
                    <span className="text-muted-foreground/40 text-xs ml-auto">×</span>
                  </div>
                </div>
              </div>

              {/* Splash screen preview */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 block">
                  Splash Screen
                </span>
                <div
                  className="rounded-lg overflow-hidden p-6 flex flex-col items-center gap-3"
                  style={{ background: "hsl(var(--ocean-deep))" }}
                >
                  <img
                    src={resolvedLogo("primary_logo")}
                    alt="Splash logo"
                    className="w-16 h-16 object-contain rounded-full ring-4 ring-white/10"
                  />
                  <p
                    className="text-white/70 text-[10px] text-center"
                    style={{ fontFamily: "var(--font-serif)" }}
                  >
                    {data.company_name || "Company Name"}
                  </p>
                  <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-white/40 rounded-full" />
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {!data.primary_logo && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">
                    No primary logo set. The default placeholder will be used across the site.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BrandingEditor;
