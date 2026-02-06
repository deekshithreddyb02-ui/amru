import { motion } from "framer-motion";
import { Scale } from "lucide-react";

const LegalNotice = () => {
  return (
    <section className="py-12 bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <Scale className="w-6 h-6 text-primary" />
            <h2 className="text-xl md:text-2xl font-serif font-bold text-primary">
              Legal Declaration / Copyright Notice
            </h2>
          </div>

          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p className="font-medium text-foreground">
              Copyright © 2025 by AMRUTA INTEGRATED WATER SOLUTIONS PVT. LTD.
            </p>

            <div className="bg-card/50 border border-border rounded-lg p-4 text-left">
              <h3 className="font-semibold text-foreground mb-2">About the Company</h3>
              <p className="mb-2">
                AMRUTA INTEGRATED WATER SOLUTIONS PVT. LTD. is a pioneering organization with over <strong className="text-foreground">35 years of experience</strong> in sustainable water management solutions across India and beyond.
              </p>
              <p>
                Headquartered in <strong className="text-foreground">Pune, Maharashtra</strong>, with offices in Mumbai, Hyderabad, and Bangalore, we specialize in groundwater exploration, rainwater harvesting, hydrogeological surveys, and integrated water resource management. Our mission is "Meeting the Challenge of Nature" — delivering innovative, eco-friendly water solutions to communities, industries, and governments.
              </p>
            </div>
            
            <p>
              (AMRUTA GROUND WATER DISCOVERY) is now an AMRUTA INTEGRATED WATER SOLUTIONS PVT. LTD. Company.
            </p>

            <p>
              All rights reserved. No part of this website may be reproduced, distributed, or transmitted in any form 
              or by any means, including photocopying, recording, or other electronic or mechanical methods, 
              without the prior written permission of the publisher, except in the case of brief embedded in critical 
              reviews and certain other non-commercial uses permitted by copyright law. For permission requests, 
              write to the publisher, addressed "Attention: Permissions Coordinator," at the address below.
            </p>

            <p>
              The Technology of the Survey Process, the website contents, and address shall change without notice. 
              Contact us for the latest information.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default LegalNotice;
