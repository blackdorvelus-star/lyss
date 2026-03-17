import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, Calendar, Settings, LogOut, ChevronLeft, ChevronRight, Shield, ShieldAlert } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";

export type Section = "clients" | "billing" | "disputes" | "calendar" | "settings";

interface AppSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onLogout?: () => void;
}

const navItems: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "clients", label: "Relations clients", icon: Users },
  { id: "billing", label: "Suivi de facturation", icon: FileText },
  { id: "calendar", label: "Gestion d'agenda", icon: Calendar },
  { id: "settings", label: "Réglages", icon: Settings },
];

const AppSidebar = ({ activeSection, onSectionChange, onLogout }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Brand */}
      <div className="flex items-center px-2 py-3 border-b border-sidebar-border">
        <img src="/logo-lyss.png" alt="Lyss" className={cn("flex-shrink-0 object-contain", collapsed ? "h-8" : "h-10")} />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
        {isAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              "text-primary hover:bg-sidebar-accent/50"
            )}
            title={collapsed ? "Administration" : undefined}
          >
            <Shield className="w-4.5 h-4.5 flex-shrink-0" />
            {!collapsed && <span className="truncate">Administration</span>}
          </button>
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border px-2 py-3 space-y-1">
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
            title={collapsed ? "Déconnexion" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span>Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
