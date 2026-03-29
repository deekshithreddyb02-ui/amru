import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ExternalLink, Play } from "lucide-react";

interface CustomSectionData {
  id: string;
  section_key: string;
  section_type: string;
  title: string | null;
  content: string | null;
  image_url: string | null;
  video_url: string | null;
  button_text: string | null;
  button_link: string | null;
  background_color: string | null;
  text_color: string | null;
}

const CustomSection = ({ sectionKey }: { sectionKey: string }) => {
  const [data, setData] = useState<CustomSectionData | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: row } = await supabase
        .from("custom_sections")
        .select("*")
        .eq("section_key", sectionKey)
        .maybeSingle();
      if (row) setData(row as CustomSectionData);
    };
    fetch();
  }, [sectionKey]);

  if (!data) return null;

  const style: React.CSSProperties = {
    backgroundColor: data.background_color || undefined,
    color: data.text_color || undefined,
  };

  if (data.section_type === "text") {
    return (
      <section className="py-16 md:py-20" style={style}>
        <div className="container mx-auto px-4 max-w-4xl">
          {data.title && (
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-6" style={{ fontFamily: "var(--font-serif)" }}>
              {data.title}
            </h2>
          )}
          {data.content && (
            <div className="text-base md:text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap text-center">
              {data.content}
            </div>
          )}
        </div>
      </section>
    );
  }

  if (data.section_type === "banner") {
    return (
      <section className="relative overflow-hidden" style={style}>
        {data.image_url && (
          <div className="relative">
            <img
              src={data.image_url}
              alt={data.title || "Banner"}
              className="w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover"
            />
            {(data.title || data.content) && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="text-center text-white px-4 max-w-3xl">
                  {data.title && (
                    <h2 className="text-2xl md:text-4xl font-bold mb-4" style={{ fontFamily: "var(--font-serif)" }}>
                      {data.title}
                    </h2>
                  )}
                  {data.content && <p className="text-sm md:text-lg opacity-90">{data.content}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  if (data.section_type === "video") {
    const getEmbedUrl = (url: string) => {
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
      return url;
    };

    return (
      <section className="py-16 md:py-20" style={style}>
        <div className="container mx-auto px-4 max-w-4xl">
          {data.title && (
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8" style={{ fontFamily: "var(--font-serif)" }}>
              {data.title}
            </h2>
          )}
          {data.content && (
            <p className="text-center text-muted-foreground mb-8">{data.content}</p>
          )}
          {data.video_url && (
            <div className="aspect-video rounded-xl overflow-hidden shadow-lg border border-border">
              <iframe
                src={getEmbedUrl(data.video_url)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={data.title || "Video"}
              />
            </div>
          )}
        </div>
      </section>
    );
  }

  if (data.section_type === "cta") {
    return (
      <section className="py-16 md:py-20" style={style}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-primary/5 border border-primary/10 rounded-2xl p-8 md:p-12">
            {data.title && (
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "var(--font-serif)" }}>
                {data.title}
              </h2>
            )}
            {data.content && (
              <p className="text-muted-foreground text-base md:text-lg mb-8">{data.content}</p>
            )}
            {data.button_text && data.button_link && (
              <Button size="lg" asChild className="gap-2">
                <a href={data.button_link} target="_blank" rel="noopener noreferrer">
                  {data.button_text}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return null;
};

export default CustomSection;
