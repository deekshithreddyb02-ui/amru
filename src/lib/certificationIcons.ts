import {
  Award,
  GraduationCap,
  BadgeCheck,
  Users,
  Trophy,
  Star,
  ShieldCheck,
  Medal,
  Building2,
  Briefcase,
  Globe,
  Handshake,
  Crown,
  Gem,
  Lightbulb,
  Leaf,
  Droplet,
  Mountain,
  Microscope,
  Hammer,
  Wrench,
  HardHat,
  CheckCircle2,
  ScrollText,
  FileBadge,
  Stamp,
  Landmark,
  University,
  Factory,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated set of icons available for certification cards.
 * Add new entries here to expose them in the admin picker.
 */
export const CERTIFICATION_ICONS: Record<string, LucideIcon> = {
  Award,
  GraduationCap,
  BadgeCheck,
  Users,
  Trophy,
  Star,
  ShieldCheck,
  Medal,
  Building2,
  Briefcase,
  Globe,
  Handshake,
  Crown,
  Gem,
  Lightbulb,
  Leaf,
  Droplet,
  Mountain,
  Microscope,
  Hammer,
  Wrench,
  HardHat,
  CheckCircle2,
  ScrollText,
  FileBadge,
  Stamp,
  Landmark,
  University,
  Factory,
  Sparkles,
};

export const CERTIFICATION_ICON_NAMES = Object.keys(CERTIFICATION_ICONS);

export const getCertificationIcon = (name: string | null | undefined): LucideIcon => {
  if (name && CERTIFICATION_ICONS[name]) return CERTIFICATION_ICONS[name];
  return Award;
};
