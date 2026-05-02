import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  MessageSquare,
  MousePointerClick,
  Eye,
  TrendingUp,
  Plus,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP = {
  pending: { label: "Aguardando aprovação", color: "text-yellow-400", icon: <Clock className="w-3.5 h-3.5" /> },
  active: { label: "Ativo", color: "text-primary", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  rejected: { label: "Rejeitado", color: "text-destructive", icon: <XCircle className="w-3.5 h-3.5" /> },
  banned: { label: "Banido", color: "text-destructive", icon: <XCircle className="w-3.5 h-3.5" /> },
  expired: { label: "Expirado", color: "text-muted-foreground", icon: <Clock className="w-3.5 h-3.5" /> },
};

export default function DashboardPage() {
  const { data: groups, isLoading: groupsLoading } = trpc.dashboard.myGroups.useQuery();
  const { data: notifications, isLoading: notifLoading } = trpc.notifications.list.useQuery();
  const { data: sub } = trpc.dashboard.subscription.useQuery();
  const markAllRead = trpc.notifications.markAllRead.useMutation();
  const utils = trpc.useUtils();

  const totalClicks = groups?.reduce((sum, g) => sum + g.totalClicks, 0) ?? 0;
  const totalViews = groups?.reduce((sum, g) => sum + g.totalViews, 0) ?? 0;
  const activeGroups = groups?.filter((g) => g.status === "active").length ?? 0;
  const unreadNotifs = notifications?.filter((n) => !n.isRead) ?? [];

  const handleMarkAllRead = async () => {
    await markAllRead.mutateAsync();
    utils.notifications.list.invalidate();
    toast.success("Notificações marcadas como lidas");
  };

  const plan = sub?.plan ?? "free";
  const planLabels: Record<string, string> = { free: "Free", starter: "Starter", pro: "Pro", premium: "Premium" };

  return (
    <DashboardLayout title="Dashboard">
      <div className="max-w-5xl space-y-6">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Visão Geral</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Gerencie seus grupos e acompanhe as métricas</p>
          </div>
          <Link href="/dashboard/grupos/novo">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Novo Grupo
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <MessageSquare className="w-5 h-5" />, value: groups?.length ?? 0, label: "Total de Grupos", color: "text-blue-400" },
            { icon: <CheckCircle className="w-5 h-5" />, value: activeGroups, label: "Grupos Ativos", color: "text-primary" },
            { icon: <MousePointerClick className="w-5 h-5" />, value: totalClicks.toLocaleString(), label: "Total de Cliques", color: "text-purple-400" },
            { icon: <Eye className="w-5 h-5" />, value: totalViews.toLocaleString(), label: "Visualizações", color: "text-orange-400" },
          ].map((stat) => (
            <Card key={stat.label} className="glass-card p-5 border-border/60">
              <div className={`${stat.color} mb-3`}>{stat.icon}</div>
              <p className="font-display font-bold text-2xl text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Groups */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-foreground">Meus Grupos</h2>
              <Link href="/dashboard/grupos">
                <Button variant="ghost" size="sm" className="text-primary gap-1 text-xs">
                  Ver todos <ArrowRight className="w-3 h-3" />
                </Button>
              </Link>
            </div>

            {groupsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl bg-secondary/40" />)}
              </div>
            ) : groups && groups.length > 0 ? (
              <div className="space-y-2">
                {groups.slice(0, 5).map((group) => {
                  const status = STATUS_MAP[group.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending;
                  return (
                    <div key={group.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-xl flex-shrink-0">
                        {group.imageUrl ? (
                          <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover rounded-lg" />
                        ) : "📱"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{group.name}</p>
                        <div className={`flex items-center gap-1 text-xs mt-0.5 ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{group.totalClicks} cliques</p>
                        <Link href={`/dashboard/grupos/${group.id}/metricas`}>
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-primary px-2 mt-0.5">
                            Métricas
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="glass-card rounded-xl p-8 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground opacity-30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm mb-4">Você ainda não cadastrou nenhum grupo</p>
                <Link href="/dashboard/grupos/novo">
                  <Button size="sm" className="bg-primary text-primary-foreground">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Cadastrar primeiro grupo
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Plan card */}
            <Card className="glass-card p-5 border-border/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-foreground">Meu Plano</h3>
                <Badge variant="outline" className={`text-xs ${plan === "premium" ? "border-yellow-400/40 text-yellow-400" : plan === "pro" ? "border-primary/40 text-primary" : plan === "starter" ? "border-blue-400/40 text-blue-400" : "border-border/60 text-muted-foreground"}`}>
                  {planLabels[plan]}
                </Badge>
              </div>
              {plan === "free" && (
                <p className="text-xs text-muted-foreground mb-3">
                  Faça upgrade para destacar seus grupos e ter acesso a analytics.
                </p>
              )}
              <Link href="/dashboard/planos">
                <Button size="sm" className="w-full bg-primary text-primary-foreground gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  {plan === "free" ? "Fazer Upgrade" : "Gerenciar Plano"}
                </Button>
              </Link>
            </Card>

            {/* Notifications */}
            <Card className="glass-card p-5 border-border/60">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notificações
                  {unreadNotifs.length > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4">
                      {unreadNotifs.length}
                    </Badge>
                  )}
                </h3>
                {unreadNotifs.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground px-2" onClick={handleMarkAllRead}>
                    Marcar lidas
                  </Button>
                )}
              </div>

              {notifLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-12 rounded-lg bg-secondary/40" />)}
                </div>
              ) : notifications && notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.slice(0, 4).map((notif) => (
                    <div key={notif.id} className={`rounded-lg p-3 text-xs ${notif.isRead ? "glass opacity-60" : "glass border-primary/20"}`}>
                      <p className="font-medium text-foreground">{notif.title}</p>
                      <p className="text-muted-foreground mt-0.5 line-clamp-1">{notif.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma notificação</p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
