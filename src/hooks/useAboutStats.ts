import { useSiteContent } from "@/hooks/useSiteContent";

interface Stat {
  icon: string;
  value: string;
  label: string;
}

const defaultStats: Stat[] = [
  { icon: "Award", value: "35+", label: "Years Experience" },
  { icon: "Building2", value: "4", label: "Office Locations" },
  { icon: "Users", value: "13,000+", label: "Projects Completed" },
  { icon: "MapPin", value: "Pan India", label: "Service Coverage" },
];

export const useAboutStats = () => {
  const { data } = useSiteContent("about");
  const metadata = data?.metadata as { stats?: Stat[] } | null;
  const stats = metadata?.stats || defaultStats;

  const findStat = (keyword: string): string => {
    const s = stats.find((st) =>
      st.label.toLowerCase().includes(keyword.toLowerCase())
    );
    return s?.value || "";
  };

  return {
    stats,
    yearsExperience: findStat("years") || findStat("experience") || "35+",
    projectsCompleted: findStat("projects") || findStat("completed") || "13,000+",
    serviceCoverage: findStat("coverage") || findStat("pan") || "Pan India",
  };
};
