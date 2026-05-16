import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Users,
  MessageSquare,
  MousePointerClick,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Bot,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const { data: stats, isLoading } = trpc.admin.stats.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const { data: pendingGroupsData } = trpc.admin.groups.useQuery({ status: "pending", page: 1, limit: 5 }, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const pendingGroups = pendingGroupsData?.groups;

  if (loading) {
    return (
      <DashboardLayout title="Admin">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <DashboardLayout title="Admin">
        <div className="text-center py-20">
          <Shield className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-3" />
          <p className="text-muted-foreground">Faça login para continuar</p>
          <Button className="mt-4 bg-primary text-primary-foreground" onClick={() => openAuthModal("login")}>
            Login
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role !== "admin") {
    return (
      <DashboardLayout title="Admin">
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-destructive opacity-50 mx-auto mb-3" />
          <h2 className="font-display font-bold text-xl text-foreground mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
          <Link href="/dashboard">
            <Button className="mt-4 bg-primary text-primary-foreground">Ir para Dashboard</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Painel Admin">
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-400/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Painel Administrativo</h1>
            <p className="text-muted-foreground text-sm">Gerencie toda a plataforma ZapGrupos</p>
          </div>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl bg-secondary/40" />)}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <MessageSquare className="w-5 h-5" />, value: stats.totalGroups, label: "Total de Grupos", color: "text-primary" },
              { icon: <Users className="w-5 h-5" />, value: stats.totalUsers, label: "Usuários", color: "text-blue-400" },
              { icon: <Clock className="w-5 h-5" />, value: stats.pendingGroups, label: "Aguardando Aprovação", color: "text-yellow-400" },
              { icon: <MousePointerClick className="w-5 h-5" />, value: stats.totalClicks.toLocaleString(), label: "Cliques Totais", color: "text-purple-400" },
            ].map((stat) => (
              <Card key={stat.label} className="glass-card p-5 border-border/60">
                <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                <p className="font-display font-bold text-2xl text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/admin/grupos">
            <Card className="glass-card p-5 border-border/60 hover:border-primary/40 cursor-pointer transition-all hover:-translate-y-0.5 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-0.5">Gerenciar Grupos</h3>
              <p className="text-xs text-muted-foreground">Aprovar, rejeitar e banir grupos</p>
              {stats?.pendingGroups != null && stats.pendingGroups > 0 && (
                <Badge className="mt-2 bg-yellow-400/10 text-yellow-400 border-yellow-400/20 text-xs">
                  {stats.pendingGroups} pendente{stats.pendingGroups !== 1 ? "s" : ""}
                </Badge>
              )}
            </Card>
          </Link>

          <Link href="/admin/usuarios">
            <Card className="glass-card p-5 border-border/60 hover:border-blue-400/40 cursor-pointer transition-all hover:-translate-y-0.5 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-400/10 flex items-center justify-center text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-0.5">Gerenciar Usuários</h3>
              <p className="text-xs text-muted-foreground">Visualizar e gerenciar contas</p>
            </Card>
          </Link>

          <Card className="glass-card p-5 border-border/60 hover:border-purple-400/40 cursor-pointer transition-all hover:-translate-y-0.5 group" onClick={() => {}}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-purple-400/10 flex items-center justify-center text-purple-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-purple-400 transition-colors" />
            </div>
            <h3 className="font-semibold text-foreground mb-0.5">Analytics da Plataforma</h3>
            <p className="text-xs text-muted-foreground">Métricas globais e relatórios</p>
          </Card>

          <Link href="/admin/scraper">
            <Card className="glass-card p-5 border-border/60 hover:border-green-400/40 cursor-pointer transition-all hover:-translate-y-0.5 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-green-400/10 flex items-center justify-center text-green-400">
                  <Bot className="w-4 h-4" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-green-400 transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-0.5">Scraping Automático</h3>
              <p className="text-xs text-muted-foreground">Importar grupos via busca web</p>
            </Card>
          </Link>
        </div>

        {/* Pending groups */}
        {pendingGroups && pendingGroups.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Grupos Aguardando Aprovação
              </h2>
              <Link href="/admin/grupos">
                <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {pendingGroups?.slice(0, 5).map((group: any) => (
                <div key={group.id} className="glass-card rounded-xl p-4 flex items-center gap-3 border-yellow-400/10">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl flex-shrink-0">📱</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{group.name}</p>
                    <p className="text-xs text-muted-foreground">{group.category?.name} • {new Date(group.createdAt).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <Link href="/admin/grupos">
                    <Button size="sm" className="bg-primary text-primary-foreground text-xs gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Revisar
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
