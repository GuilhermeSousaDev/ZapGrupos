import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Plus,
  Edit,
  Trash2,
  BarChart3,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  Star,
  MousePointerClick,
  Eye,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

const STATUS_MAP = {
  pending: { label: "Aguardando aprovação", variant: "outline" as const, className: "border-yellow-400/40 text-yellow-400" },
  active: { label: "Ativo", variant: "outline" as const, className: "border-primary/40 text-primary" },
  rejected: { label: "Rejeitado", variant: "outline" as const, className: "border-destructive/40 text-destructive" },
  banned: { label: "Banido", variant: "outline" as const, className: "border-destructive/40 text-destructive" },
  expired: { label: "Expirado", variant: "outline" as const, className: "border-border/60 text-muted-foreground" },
};

export default function MyGroupsPage() {
  const { data: groups, isLoading } = trpc.dashboard.myGroups.useQuery();
  const deleteGroup = trpc.dashboard.deleteGroup.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteGroup.mutateAsync({ id });
      utils.dashboard.myGroups.invalidate();
      toast.success(`Grupo "${name}" removido com sucesso`);
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao remover grupo");
    }
  };

  return (
    <DashboardLayout title="Meus Grupos">
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">Meus Grupos</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {groups?.length ?? 0} grupo{groups?.length !== 1 ? "s" : ""} cadastrado{groups?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/dashboard/grupos/novo">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
              <Plus className="w-4 h-4" />
              Novo Grupo
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl bg-secondary/40" />)}
          </div>
        ) : groups && groups.length > 0 ? (
          <div className="space-y-3">
            {groups.map((group) => {
              const status = STATUS_MAP[group.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pending;
              return (
                <div key={group.id} className="glass-card rounded-xl p-5 border-border/60">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0">
                      {group.imageUrl ? (
                        <img src={group.imageUrl} alt={group.name} className="w-full h-full object-cover rounded-xl" />
                      ) : "📱"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{group.name}</h3>
                            {group.isFeatured && (
                              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{group.category?.name}</p>
                        </div>
                        <Badge variant={status.variant} className={`text-xs flex-shrink-0 ${status.className}`}>
                          {status.label}
                        </Badge>
                      </div>

                      {group.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-1">{group.description}</p>
                      )}

                      {/* Metrics */}
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="w-3 h-3" />
                          {group.totalClicks.toLocaleString()} cliques
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {group.totalViews.toLocaleString()} views
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          Score: {Math.round(group.rankScore)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
                    <Link href={`/dashboard/grupos/${group.id}/editar`}>
                      <Button variant="outline" size="sm" className="gap-1.5 border-border/60 hover:border-primary/40 text-xs">
                        <Edit className="w-3 h-3" />
                        Editar
                      </Button>
                    </Link>
                    <Link href={`/dashboard/grupos/${group.id}/metricas`}>
                      <Button variant="outline" size="sm" className="gap-1.5 border-border/60 hover:border-primary/40 text-xs">
                        <BarChart3 className="w-3 h-3" />
                        Métricas
                      </Button>
                    </Link>
                    {group.status === "active" && (
                      <a href={`/grupo/${group.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5 border-border/60 text-xs">
                          <ExternalLink className="w-3 h-3" />
                          Ver
                        </Button>
                      </a>
                    )}
                    <div className="ml-auto">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 text-xs">
                            <Trash2 className="w-3 h-3" />
                            Remover
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Remover grupo?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              O grupo "{group.name}" será removido permanentemente. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border/60">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(group.id, group.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center">
            <MessageSquare className="w-14 h-14 text-muted-foreground opacity-30 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-foreground mb-2">Nenhum grupo ainda</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Cadastre seu primeiro grupo do WhatsApp e comece a receber membros.
            </p>
            <Link href="/dashboard/grupos/novo">
              <Button className="bg-primary text-primary-foreground gap-2">
                <Plus className="w-4 h-4" />
                Cadastrar meu primeiro grupo
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
