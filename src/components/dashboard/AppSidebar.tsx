import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, FileText, Calendar, Settings, LogOut, ChevronLeft, ChevronRight, Shield, ShieldAlert, Menu, X, FileBarChart, Link2 } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";

export type Section = "clients" | "billing" | "disputes" | "reports" | "calendar" | "settings" | "integrations";

interface AppSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  onLogout?: () => void;
}

const navItems: { id: Section; label: string; icon: typeof Users }[] = [
  { id: "billing", label: "Facturation", icon: FileText },
  { id: "clients", label: "Clients", icon: Users },
  { id: "disputes", label: "Litiges", icon: ShieldAlert },
  { id: "reports", label: "Rapports", icon: FileBarChart },
  { id: "calendar", label: "Agenda", icon: Calendar },
  { id: "settings", label: "Réglages", icon: Settings },
];

const AppSidebar = ({ activeSection, onSectionChange, onLogout }: AppSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleNav = (section: Section) => {
    onSectionChange(section);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border flex items-center justify-around px-1 py-1.5 safe-bottom">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-0 flex-1",
                isActive ? "text-primary" : "text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </button>
          );
        })}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-sidebar-foreground min-w-0"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-[10px] font-medium">Sortir</span>
          </button>
        )}
      </nav>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "h-screen sticky top-0 bg-sidebar border-r border-sidebar-border flex-col transition-all duration-200 hidden md:flex",
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
    </>
  );
};

export default AppSidebar;
