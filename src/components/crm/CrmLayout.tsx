import { Outlet, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CrmSidebar from "./CrmSidebar";

const WORKSPACE_NAMES: Record<string, string> = {
  mh: "Maharashtra",
  hyd: "Hyderabad (TS + AP)",
  blr: "Bangalore (Karnataka)",
  others: "Others / International",
};

export default function CrmLayout() {
  const { slug } = useParams<{ slug: string }>();
  return (
    <div className="min-h-screen flex bg-[#0a1118] text-white">
      <CrmSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-white/5 bg-[#0f1923] flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Link to="/crm" className="text-white/60 hover:text-white flex items-center gap-1.5 text-sm">
              <ArrowLeft className="w-4 h-4" /> Workspaces
            </Link>
            <span className="text-white/30">/</span>
            <span className="text-sm font-medium">{WORKSPACE_NAMES[slug || ""] || slug}</span>
          </div>
          <div className="text-xs text-white/40">Amruta CRM</div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
