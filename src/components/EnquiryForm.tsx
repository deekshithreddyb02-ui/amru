import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Loader2,
  User,
  Phone,
  MapPin,
  Ruler,
  Send,
  Calendar,
  Briefcase,
  Navigation,
  ScanLine,
  LandPlot,
  IndianRupee,
  MessageSquare,
  Home,
  Building2,
  Mail as MailIcon,
  Wrench,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BIZ_AREAS = ["Maharashtra", "Telangana", "Karnataka", "AndhraPradesh", "Others"];
const DISTANCES = [
  "0-30 KM", "50 KM", "100 KM", "150 KM", "200 KM", "250 KM",
  "300 KM", "400 KM", "500 KM", "700 KM", "800 KM", "1000 KM", "1500 KM", "2000 KM",
];
const SERVICES_LIST = ["GWS", "RWH", "iGEOS", "GeoTech", "THRML-IMG", "GPR", "STP", "ETP", "CGWA", "NOCB", "MEP"];
const SCANS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
const AREA_TYPES = ["OPEN PLOT", "APPRT", "MANFCT PLANT", "IT BLDG", "BANGLOW", "SINGLE BLDG", "ORG LAND"];

interface EnquiryFormProps {
  serviceTitle: string;
  onSuccess: () => void;
}

const stagger = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.035, duration: 0.25, ease: [0, 0, 0.2, 1] as const },
  }),
};

const EnquiryForm = ({ serviceTitle, onSuccess }: EnquiryFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Fields
  const [lastName, setLastName] = useState("");
  const [expectedClose, setExpectedClose] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [whatsapp, setWhatsapp] = useState("");
  const [bizArea, setBizArea] = useState("Telangana");
  const [distance, setDistance] = useState("0-30 KM");
  const [totalArea, setTotalArea] = useState("Gunta: \nAcres: \nSq.Yrds: \nSq.Ft:");
  const [serviceNeeded, setServiceNeeded] = useState(() => {
    const match = SERVICES_LIST.find((s) => serviceTitle.toLowerCase().includes(s.toLowerCase()));
    return match || "GWS";
  });
  const [numScans, setNumScans] = useState("1");
  const [areaType, setAreaType] = useState("OPEN PLOT");
  const [totalBizCost, setTotalBizCost] = useState("");
  const [description, setDescription] = useState("");
  const [mailingStreet, setMailingStreet] = useState("");
  const [mailingCity, setMailingCity] = useState("");
  const [mailingPoBox, setMailingPoBox] = useState("");

  // Listen for iframe load to detect submission complete
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const onLoad = () => {
      if (isSubmitting) {
        setIsSubmitting(false);
        toast.success("Enquiry submitted successfully! We'll contact you soon.");
        onSuccess();
      }
    };
    iframe.addEventListener("load", onLoad);
    return () => iframe.removeEventListener("load", onLoad);
  }, [isSubmitting, onSuccess]);

  const handleSubmit = () => {
    if (!lastName.trim() || !whatsapp.trim() || !totalBizCost.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    formRef.current?.submit();
  };

  const fieldIcon = "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60 pointer-events-none";
  const inputCls =
    "pl-10 bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] hover:border-primary/30";
  const selectCls = "bg-background/60 border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-200 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)]";

  let idx = 0;

  return (
    <>
      <iframe ref={iframeRef} name="vtiger_submit_frame" className="hidden" title="submit" />

      <form
        ref={formRef}
        action="https://appscomsolutions.com/VTCRM/modules/Webforms/capture.php"
        method="post"
        acceptCharset="utf-8"
        encType="multipart/form-data"
        target="vtiger_submit_frame"
        className="space-y-3 mt-2 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin"
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
      >
        {/* Hidden fields */}
        <input type="hidden" name="__vtrftk" value="sid:c13e250974b2e7ea0ef70de7fecdcc0cc6191ec5,1773737516" />
        <input type="hidden" name="publicid" value="85432a838b51f53a6bc4ec937b64ee40" />
        <input type="hidden" name="urlencodeenable" value="1" />
        <input type="hidden" name="name" value="Enquiry Form: Telangana - Amruta HydroGeo Services" />

        {/* Last Name */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <User className="h-3.5 w-3.5 text-primary" /> Name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className={fieldIcon} />
            <Input
              name="lastname"
              required
              maxLength={100}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your full name"
              className={inputCls}
            />
          </div>
        </motion.div>

        {/* Expected Close Date */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <Calendar className="h-3.5 w-3.5 text-primary" /> Expected Close Date <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Calendar className={fieldIcon} />
            <Input
              name="cf_1044"
              type="date"
              required
              value={expectedClose}
              onChange={(e) => setExpectedClose(e.target.value)}
              className={inputCls}
            />
          </div>
        </motion.div>

        {/* WhatsApp */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <Phone className="h-3.5 w-3.5 text-primary" /> WhatsApp Number <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Phone className={fieldIcon} />
            <Input
              name="cf_1022"
              required
              maxLength={15}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className={inputCls}
            />
          </div>
        </motion.div>

        {/* BIZ Area & Distance */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              <MapPin className="h-3 w-3 text-primary" /> BIZ Area <span className="text-destructive">*</span>
            </Label>
            <select name="cf_990" value={bizArea} onChange={(e) => setBizArea(e.target.value)} required className="hidden">
              {BIZ_AREAS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <Select value={bizArea} onValueChange={setBizArea}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
                {BIZ_AREAS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              <Navigation className="h-3 w-3 text-primary" /> Distance <span className="text-destructive">*</span>
            </Label>
            <select name="cf_998" value={distance} onChange={(e) => setDistance(e.target.value)} required className="hidden">
              {DISTANCES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <Select value={distance} onValueChange={setDistance}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95 max-h-48">
                {DISTANCES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Service Needed & Number of Scans */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              <Wrench className="h-3 w-3 text-primary" /> Service <span className="text-destructive">*</span>
            </Label>
            <select name="cf_994" value={serviceNeeded} onChange={(e) => setServiceNeeded(e.target.value)} required className="hidden">
              {SERVICES_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Select value={serviceNeeded} onValueChange={setServiceNeeded}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
                {SERVICES_LIST.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              <ScanLine className="h-3 w-3 text-primary" /> Scans <span className="text-destructive">*</span>
            </Label>
            <select name="cf_1014" value={numScans} onChange={(e) => setNumScans(e.target.value)} required className="hidden">
              {SCANS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Select value={numScans} onValueChange={setNumScans}>
              <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
              <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
                {SCANS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Area Type */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <LandPlot className="h-3.5 w-3.5 text-primary" /> Area Type <span className="text-destructive">*</span>
          </Label>
          <select name="cf_1002" value={areaType} onChange={(e) => setAreaType(e.target.value)} required className="hidden">
            {AREA_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <Select value={areaType} onValueChange={setAreaType}>
            <SelectTrigger className={selectCls}><SelectValue /></SelectTrigger>
            <SelectContent className="border-border/50 backdrop-blur-md bg-background/95">
              {AREA_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Total Area */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <Ruler className="h-3.5 w-3.5 text-primary" /> Total Area <span className="text-destructive">*</span>
          </Label>
          <Textarea
            name="cf_1006"
            required
            value={totalArea}
            onChange={(e) => setTotalArea(e.target.value)}
            rows={4}
            className="bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] hover:border-primary/30 text-sm resize-none font-mono"
          />
        </motion.div>

        {/* Total BIZ Cost */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <IndianRupee className="h-3.5 w-3.5 text-primary" /> Total BIZ Cost <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <IndianRupee className={fieldIcon} />
            <Input
              name="cf_1020"
              required
              value={totalBizCost}
              onChange={(e) => setTotalBizCost(e.target.value)}
              placeholder="e.g. 50000"
              className={inputCls}
            />
          </div>
        </motion.div>

        {/* Description */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <MessageSquare className="h-3.5 w-3.5 text-primary" /> Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            name="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your requirements..."
            rows={3}
            className="bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] hover:border-primary/30 text-sm resize-none"
          />
        </motion.div>

        {/* Mailing Address (optional) */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
            <Home className="h-3.5 w-3.5 text-primary" /> Mailing Street
          </Label>
          <Textarea
            name="mailingstreet"
            value={mailingStreet}
            onChange={(e) => setMailingStreet(e.target.value)}
            placeholder="Street address (optional)"
            rows={2}
            className="bg-background/60 border-border/50 backdrop-blur-sm transition-all duration-200 focus:bg-background focus:border-primary/40 focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.08)] hover:border-primary/30 text-sm resize-none"
          />
        </motion.div>

        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              <Building2 className="h-3 w-3 text-primary" /> Mailing City
            </Label>
            <div className="relative">
              <Building2 className={fieldIcon} />
              <Input
                name="mailingcity"
                value={mailingCity}
                onChange={(e) => setMailingCity(e.target.value)}
                placeholder="City"
                className={inputCls}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
              <MailIcon className="h-3 w-3 text-primary" /> P.O. Box
            </Label>
            <div className="relative">
              <MailIcon className={fieldIcon} />
              <Input
                name="mailingpobox"
                value={mailingPoBox}
                onChange={(e) => setMailingPoBox(e.target.value)}
                placeholder="P.O. Box"
                className={inputCls}
              />
            </div>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div custom={idx++} variants={stagger} initial="hidden" animate="visible" className="pt-1">
          <Button
            type="submit"
            className="w-full gap-2.5 h-12 font-bold text-sm relative overflow-hidden bg-gradient-to-r from-primary to-primary/85 hover:from-primary/90 hover:to-primary shadow-[0_4px_20px_-6px_hsl(var(--primary)/0.4)] hover:shadow-[0_8px_30px_-6px_hsl(var(--primary)/0.5)] transition-all duration-300 rounded-xl"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Enquiry
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </>
  );
};

export default EnquiryForm;
