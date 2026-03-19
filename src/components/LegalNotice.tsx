import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useNoMotion } from "@/hooks/useNoMotion";

const fallback = {
  title: "Legal Declaration / Copyright Notice",
  content: 'All rights reserved. No part of this website may be reproduced, distributed, or transmitted in any form or by any means, including photocopying, recording, or other electronic or mechanical methods, without the prior written permission of the publisher, except in the case of brief embedded in critical reviews and certain other non-commercial uses permitted by copyright law.',
  copyright_line: "Copyright © 2025 by AMRUTA INTEGRATED WATER SOLUTIONS PVT. LTD.",
  company_note: "(AMRUTA GROUND WATER DISCOVERY) is now an AMRUTA INTEGRATED WATER SOLUTIONS PVT. LTD. Company.",
  disclaimer: "The Technology of the Survey Process, the website contents, and address shall change without notice. Contact us for the latest information.",
};

const LegalNotice = () => {
  const { data } = useSiteContent("legal_notice");
  const meta = (data?.metadata as Record<string, string>) || {};
  const title = data?.title || fallback.title;
  const content = data?.content || fallback.content;
  const copyrightLine = meta.copyright_line || fallback.copyright_line;
  const companyNote = meta.company_note || fallback.company_note;
  const disclaimer = meta.disclaimer || fallback.disclaimer;
  const noMotion = useNoMotion();
  const m = (props: Record<string, unknown>) => noMotion ? {} : props;

  return (
    <section className="py-12 border-t border-border" style={{ background: 'hsl(var(--muted) / 0.5)' }}>
      <div className="container mx-auto px-4">
        <motion.div {...m({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } })} className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Scale className="w-5 h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-bold text-primary" style={{ fontFamily: 'var(--font-serif)' }}>{title}</h2>
          </div>
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground text-sm">{copyrightLine}</p>
            <p>{companyNote}</p>
            <p>{content}</p>
            <p>{disclaimer}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LegalNotice;
