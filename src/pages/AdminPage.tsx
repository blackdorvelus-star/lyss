import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users, FileText, DollarSign, TrendingUp, Shield, Loader2,
  ArrowLeft, Crown, BarChart3, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalInvoices: number;
  totalAmount: number;
  totalRecovered: number;
  pendingCount: number;
  recoveredCount: number;
  recoveryRate: number;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
}

const AdminPage = () => {
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [adminLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-stats`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!res.ok) throw new Error("Accès refusé");
      const data = await res.json();
      setStats(data.stats);
      setUsers(data.users);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const statCards = [
    { label: "Utilisateurs", value: stats?.totalUsers || 0, icon: Users, color: "text-primary" },
    { label: "Clients", value: stats?.totalClients || 0, icon: UserCheck, color: "text-accent" },
    { label: "Factures", value: stats?.totalInvoices || 0, icon: FileText, color: "text-primary" },
    { label: "Montant total", value: `${(stats?.totalAmount || 0).toLocaleString("fr-CA")} $`, icon: DollarSign, color: "text-accent" },
    { label: "Récupéré", value: `${(stats?.totalRecovered || 0).toLocaleString("fr-CA")} $`, icon: TrendingUp, color: "text-primary" },
    { label: "Taux de récupération", value: `${stats?.recoveryRate || 0}%`, icon: BarChart3, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-display text-xl font-bold">Administration</h1>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">Admin</Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats grid */}
        <div>
          <h2 className="font-display font-bold text-lg mb-4">Statistiques globales</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <p className="font-display font-bold text-xl">{card.value}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pending vs Recovered */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold text-accent">{stats?.pendingCount || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Factures en attente</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
            <p className="text-2xl font-display font-bold text-primary">{stats?.recoveredCount || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Factures récupérées</p>
          </div>
        </div>

        {/* Users table */}
        <div>
          <h2 className="font-display font-bold text-lg mb-4">
            Utilisateurs ({users.length})
          </h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Courriel</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Inscrit le</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Dernière connexion</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Rôles</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                      <td className="px-4 py-3 font-medium">{u.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("fr-CA")}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleDateString("fr-CA")
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {u.roles.length > 0 ? (
                          u.roles.map((r) => (
                            <Badge
                              key={r}
                              className={
                                r === "admin"
                                  ? "bg-primary/10 text-primary border-primary/20 mr-1"
                                  : "bg-secondary text-secondary-foreground mr-1"
                              }
                            >
                              {r === "admin" && <Crown className="w-3 h-3 mr-1" />}
                              {r}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">utilisateur</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
