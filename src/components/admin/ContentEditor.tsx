import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Edit2, X } from "lucide-react";
import { SiteContent, useAllSiteContent } from "@/hooks/useSiteContent";

const sectionLabels: Record<string, string> = {
  hero: "Hero Section",
  about: "About Us",
  whyus: "Why Choose Us",
  offices: "Our Offices",
  contact_details: "Contact Details (Phone & Email)",
  settings: "Site Settings",
};

interface Office {
  city: string;
  address: string;
  whatsapp: string;
  phone: string;
}

const ContentEditor = () => {
  const { data: contents, loading, updateContent, refetch } = useAllSiteContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SiteContent>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const startEdit = (content: SiteContent) => {
    setEditingId(content.id);
    setEditData({
      title: content.title,
      content: content.content,
      metadata: content.metadata,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    const result = await updateContent(id, editData);
    setSaving(false);

    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Content updated successfully" });
      setEditingId(null);
      setEditData({});
    }
  };

  const updateMetadataField = (key: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      metadata: {
        ...(prev.metadata as Record<string, any> || {}),
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {contents.map((content) => {
        const isEditing = editingId === content.id;
        const metadata = (isEditing ? editData.metadata : content.metadata) as Record<string, any> | null;

        return (
          <Card key={content.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                {sectionLabels[content.section_key] || content.section_key}
              </CardTitle>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => startEdit(content)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => handleSave(content.id)} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title</Label>
                {isEditing ? (
                  <Input
                    value={editData.title || ""}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">{content.title || "-"}</p>
                )}
              </div>

              <div>
                <Label>Content</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.content || ""}
                    onChange={(e) => setEditData({ ...editData, content: e.target.value })}
                    className="mt-1 min-h-[100px]"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {content.content || "-"}
                  </p>
                )}
              </div>

              {/* Hero-specific fields */}
              {content.section_key === "hero" && (
                <div>
                  <Label>Background Image URL</Label>
                  {isEditing ? (
                    <Input
                      value={metadata?.backgroundImage || ""}
                      onChange={(e) => updateMetadataField("backgroundImage", e.target.value)}
                      className="mt-1"
                      placeholder="https://..."
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {(content.metadata as any)?.backgroundImage || "-"}
                    </p>
                  )}
                </div>
              )}

              {content.section_key === "hero" && (
                <div>
                  <Label>Services (one per line)</Label>
                  {isEditing ? (
                    <Textarea
                      value={(metadata?.services || []).join("\n")}
                      onChange={(e) => updateMetadataField("services", e.target.value.split("\n").filter(Boolean))}
                      className="mt-1 min-h-[150px]"
                    />
                  ) : (
                    <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside">
                      {((content.metadata as any)?.services || []).map((s: string, i: number) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                )}
              </div>
              )}

              {/* Offices-specific fields */}
              {content.section_key === "offices" && (
                <div>
                  <Label>Office Locations (JSON format)</Label>
                  {isEditing ? (
                    <div className="space-y-3 mt-2">
                      {((metadata?.offices || []) as Office[]).map((office, index) => (
                        <div key={index} className="p-3 border border-border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs">Office {index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const offices = [...((metadata?.offices || []) as Office[])];
                                offices.splice(index, 1);
                                updateMetadataField("offices", offices);
                              }}
                              className="h-6 px-2 text-destructive"
                            >
                              Remove
                            </Button>
                          </div>
                          <Input
                            value={office.city}
                            onChange={(e) => {
                              const offices = [...((metadata?.offices || []) as Office[])];
                              offices[index] = { ...offices[index], city: e.target.value };
                              updateMetadataField("offices", offices);
                            }}
                            placeholder="City name"
                            className="text-sm"
                          />
                          <Input
                            value={office.address}
                            onChange={(e) => {
                              const offices = [...((metadata?.offices || []) as Office[])];
                              offices[index] = { ...offices[index], address: e.target.value };
                              updateMetadataField("offices", offices);
                            }}
                            placeholder="Full address"
                            className="text-sm"
                          />
                          <Input
                            value={office.whatsapp || ""}
                            onChange={(e) => {
                              const offices = [...((metadata?.offices || []) as Office[])];
                              offices[index] = { ...offices[index], whatsapp: e.target.value };
                              updateMetadataField("offices", offices);
                            }}
                            placeholder="WhatsApp (e.g. 917410030418)"
                            className="text-sm"
                          />
                          <Input
                            value={office.phone || ""}
                            onChange={(e) => {
                              const offices = [...((metadata?.offices || []) as Office[])];
                              offices[index] = { ...offices[index], phone: e.target.value };
                              updateMetadataField("offices", offices);
                            }}
                            placeholder="Phone (e.g. +91-741-0030-418)"
                            className="text-sm"
                          />
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const offices = [...((metadata?.offices || []) as Office[])];
                          offices.push({ city: "", address: "", whatsapp: "", phone: "" });
                          updateMetadataField("offices", offices);
                        }}
                      >
                        + Add Office
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      {((content.metadata as any)?.offices || []).map((office: Office, i: number) => (
                        <div key={i} className="text-sm">
                          <span className="font-medium">{office.city}:</span>{" "}
                          <span className="text-muted-foreground">{office.address}</span>
                          {office.whatsapp && <span className="text-muted-foreground ml-2">| WA: {office.whatsapp}</span>}
                          {office.phone && <span className="text-muted-foreground ml-2">| ☎ {office.phone}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Contact Details fields */}
              {content.section_key === "contact_details" && (
                <div>
                  <Label>Phone Numbers & Emails</Label>
                  {isEditing ? (
                    <div className="space-y-4 mt-2">
                      <div>
                        <Label className="text-xs">Phone Numbers</Label>
                        {((metadata?.phones || []) as string[]).map((phone, index) => (
                          <div key={index} className="flex gap-2 mt-1">
                            <Input
                              value={phone}
                              onChange={(e) => {
                                const phones = [...((metadata?.phones || []) as string[])];
                                phones[index] = e.target.value;
                                updateMetadataField("phones", phones);
                              }}
                              placeholder="+91-XXX-XXXX-XXX"
                              className="text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const phones = [...((metadata?.phones || []) as string[])];
                                phones.splice(index, 1);
                                updateMetadataField("phones", phones);
                              }}
                              className="text-destructive shrink-0"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            const phones = [...((metadata?.phones || []) as string[])];
                            phones.push("");
                            updateMetadataField("phones", phones);
                          }}
                        >
                          + Add Phone
                        </Button>
                      </div>
                      <div>
                        <Label className="text-xs">Email Addresses</Label>
                        {((metadata?.emails || []) as string[]).map((email, index) => (
                          <div key={index} className="flex gap-2 mt-1">
                            <Input
                              value={email}
                              onChange={(e) => {
                                const emails = [...((metadata?.emails || []) as string[])];
                                emails[index] = e.target.value;
                                updateMetadataField("emails", emails);
                              }}
                              placeholder="email@example.com"
                              className="text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const emails = [...((metadata?.emails || []) as string[])];
                                emails.splice(index, 1);
                                updateMetadataField("emails", emails);
                              }}
                              className="text-destructive shrink-0"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            const emails = [...((metadata?.emails || []) as string[])];
                            emails.push("");
                            updateMetadataField("emails", emails);
                          }}
                        >
                          + Add Email
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                      {((content.metadata as any)?.phones || []).map((p: string, i: number) => (
                        <div key={`p${i}`}>📞 {p}</div>
                      ))}
                      {((content.metadata as any)?.emails || []).map((e: string, i: number) => (
                        <div key={`e${i}`}>✉️ {e}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {content.section_key === "settings" && (
                <div>
                  <Label>WhatsApp Number (without + symbol, e.g., 917410030418)</Label>
                  {isEditing ? (
                    <Input
                      value={metadata?.whatsapp_number || ""}
                      onChange={(e) => updateMetadataField("whatsapp_number", e.target.value)}
                      className="mt-1"
                      placeholder="917410030418"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1">
                      {(content.metadata as any)?.whatsapp_number || "-"}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(content.updated_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ContentEditor;
