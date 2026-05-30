import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const user = useAppStore((state) => state.user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth Guards
    if (!user) {
      navigate("/login");
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-screen bg-[#0f1115]">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col min-h-screen">
        <TopNav />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
