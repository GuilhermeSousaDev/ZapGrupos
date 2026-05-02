import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { MousePointerClick, Eye, Users, TrendingUp, ChevronLeft } from "lucide-react";

export default function MetricsPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);

  const { data: group, isLoading: groupLoading } = trpc.groups.byId.useQuery({ id: groupId }, { enabled: !!groupId });
  const { data: metrics, isLoading: metricsLoading } = trpc.dashboard.groupMetrics.useQuery({ groupId }, { enabled: !!groupId });

  const isLoading = groupLoading || metricsLoading;

  // Aggregate click history by day
  const dailyClicks = metrics?.clickHistory
    ? Object.entries(
        metrics.clickHistory.reduce((acc: Record<string, number>, c) => {
          const day = new Date(c.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
          acc[day] = (acc[day] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([date, clicks]) => ({ date, clicks }))
    : [];

  return (
    <DashboardLayout title="Métricas">
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/grupos">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Meus Grupos
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium text-sm">{group?.name ?? "Métricas"}</span>
        </div>

        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Métricas do Grupo</h1>
          {group && <p className="text-muted-foreground text-sm mt-0.5">{group.name}</p>}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl bg-secondary/40" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: <MousePointerClick className="w-5 h-5" />, value: group?.totalClicks.toLocaleString() ?? "0", label: "Total de Cliques", color: "text-primary" },
              { icon: <Eye className="w-5 h-5" />, value: group?.totalViews.toLocaleString() ?? "0", label: "Visualizações", color: "text-blue-400" },
              { icon: <Users className="w-5 h-5" />, value: group?.memberCount?.toLocaleString() ?? "—", label: "Membros", color: "text-purple-400" },
              { icon: <TrendingUp className="w-5 h-5" />, value: Math.round(group?.rankScore ?? 0).toString(), label: "Score de Ranking", color: "text-orange-400" },
            ].map((stat) => (
              <Card key={stat.label} className="glass-card p-5 border-border/60">
                <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                <p className="font-display font-bold text-2xl text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </Card>
            ))}
          </div>
        )}

        {dailyClicks.length > 0 && (
          <Card className="glass-card p-6 border-border/60">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">Cliques por Dia</h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyClicks}>
                <defs>
                  <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.72 0.19 145)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.72 0.19 145)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.015 240)" />
                <XAxis dataKey="date" tick={{ fill: "oklch(0.60 0.015 240)", fontSize: 11 }} />
                <YAxis tick={{ fill: "oklch(0.60 0.015 240)", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "oklch(0.11 0.012 240)", border: "1px solid oklch(0.20 0.015 240)", borderRadius: "8px", color: "oklch(0.97 0.005 240)" }} />
                <Area type="monotone" dataKey="clicks" stroke="oklch(0.72 0.19 145)" fill="url(#clickGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        {!metrics && !isLoading && (
          <Card className="glass-card p-12 border-border/60 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground opacity-30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Dados de métricas aparecerão aqui conforme seu grupo receber visitas e cliques.</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
