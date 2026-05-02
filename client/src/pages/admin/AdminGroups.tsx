import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { CheckCircle, XCircle, Shield, Star, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "border-yellow-400/40 text-yellow-400",
  active: "border-primary/40 text-primary",
  rejected: "border-destructive/40 text-destructive",
  banned: "border-destructive/40 text-destructive",
  expired: "border-border/60 text-muted-foreground",
};

export default function AdminGroups() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.admin.groups.useQuery(
    { status: statusFilter === "all" ? undefined : statusFilter, page, limit: 15 },
    { enabled: user?.role === "admin" }
  );

  const approveGroup = trpc.admin.approveGroup.useMutation();
  const rejectGroup = trpc.admin.rejectGroup.useMutation();
  const banGroup = trpc.admin.banGroup.useMutation();
  const featureGroup = trpc.admin.featureGroup.useMutation();

  const handleApprove = async (id: number, name: string) => {
    try {
      await approveGroup.mutateAsync({ id });
      toast.success(`"${name}" aprovado!`);
      refetch();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async (id: number, name: string) => {
    try {
      await rejectGroup.mutateAsync({ id });
      toast.success(`"${name}" rejeitado`);
      refetch();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleBan = async (id: number, name: string) => {
    try {
      await banGroup.mutateAsync({ id });
      toast.success(`"${name}" banido`);
      refetch();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleFeature = async (id: number, featured: boolean, name: string) => {
    try {
      await featureGroup.mutateAsync({ id, featured, days: 30 });
      toast.success(featured ? `"${name}" em destaque por 30 dias` : `Destaque removido de "${name}"`);
      refetch();
    } catch (e: any) { toast.error(e.message); }
  };

  if (user?.role !== "admin") {
    return (
      <DashboardLayout title="Admin - Grupos">
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-destructive opacity-50 mx-auto mb-3" />
          <p className="text-muted-foreground">Acesso negado</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalPages = data ? Math.ceil(data.total / 15) : 0;

  return (
    <DashboardLayout title="Admin - Grupos">
      <div className="max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Gerenciar Grupos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {data?.total ?? 0} grupo{data?.total !== 1 ? "s" : ""}
            </p>
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-44 bg-secondary/50 border-border/60 text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="rejected">Rejeitados</SelectItem>
              <SelectItem value="banned">Banidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-xl bg-secondary/40" />)}
          </div>
        ) : data?.groups && data.groups.length > 0 ? (
          <>
            <div className="space-y-3">
              {data.groups.map((group: any) => (
                <div key={group.id} className="glass-card rounded-xl p-5 border-border/60">
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center text-xl flex-shrink-0">
                      {group.imageUrl ? <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover rounded-xl" /> : "📱"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground text-sm">{group.name}</h3>
                            {group.isFeatured && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {group.category?.name} • Dono: {group.owner?.name ?? "—"} • {new Date(group.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                          {group.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{group.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={`text-xs flex-shrink-0 ${STATUS_COLORS[group.status] ?? ""}`}>
                          {group.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {group.status === "pending" && (
                          <>
                            <Button size="sm" onClick={() => handleApprove(group.id, group.name)} className="bg-primary text-primary-foreground text-xs gap-1 h-7">
                              <CheckCircle className="w-3 h-3" /> Aprovar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleReject(group.id, group.name)} className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs gap-1 h-7">
                              <XCircle className="w-3 h-3" /> Rejeitar
                            </Button>
                          </>
                        )}
                        {group.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFeature(group.id, !group.isFeatured, group.name)}
                              className={`text-xs gap-1 h-7 ${group.isFeatured ? "border-yellow-400/40 text-yellow-400" : "border-border/60"}`}
                            >
                              <Star className="w-3 h-3" />
                              {group.isFeatured ? "Remover destaque" : "Destacar"}
                            </Button>
                          </>
                        )}
                        {group.status !== "banned" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 text-xs gap-1 h-7">
                                <Shield className="w-3 h-3" /> Banir
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-card border-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Banir grupo?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  O grupo "{group.name}" será banido permanentemente da plataforma.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-border/60">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleBan(group.id, group.name)} className="bg-destructive text-destructive-foreground">
                                  Banir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <a href={group.whatsappLink} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="text-muted-foreground text-xs gap-1 h-7">
                            <ExternalLink className="w-3 h-3" /> Link
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border-border/60">Anterior</Button>
                <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="border-border/60">Próxima</Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum grupo com este status</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
