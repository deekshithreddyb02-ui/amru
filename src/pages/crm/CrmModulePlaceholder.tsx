import { useLocation } from "react-router-dom";
import { Construction } from "lucide-react";

export default function CrmModulePlaceholder({ title }: { title?: string }) {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);
  const label = title || segments[segments.length - 1]?.replace(/-/g, " ") || "Module";

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto bg-[#0f1923] border border-white/5 rounded-lg p-10 text-center">
        <Construction className="w-10 h-10 mx-auto text-white/30 mb-4" />
        <h2 className="text-xl font-semibold capitalize mb-1">{label}</h2>
        <p className="text-white/50 text-sm">
          This module will be built in an upcoming phase. The database is ready —
          ask to "build the {label} module" when you're ready.
        </p>
      </div>
    </div>
  );
}
