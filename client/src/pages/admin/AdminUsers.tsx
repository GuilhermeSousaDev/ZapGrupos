import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Shield, Users, AlertTriangle, Crown } from "lucide-react";
import { toast } from "sonner";

export default function AdminUsers() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = trpc.admin.users.useQuery(
    { page, limit: 20 },
    { enabled: user?.role === "admin" }
  );

  const banUser = trpc.admin.banUser.useMutation();
  const promoteUser = trpc.admin.promoteUser.useMutation();

  const handleBan = async (id: number, name: string, banned: boolean) => {
    try {
      await banUser.mutateAsync({ id, banned });
      toast.success(banned ? `"${name}" banido` : `"${name}" desbanido`);
      refetch();
    } catch (e: any) { toast.error(e.message); }
  };

  const handlePromote = async (id: number, name: string, role: "user" | "admin") => {
    try {
      await promoteUser.mutateAsync({ id, role });
      toast.success(`"${name}" agora é ${role === "admin" ? "administrador" : "usuário"}`);
      refetch();
    } catch (e: any) { toast.error(e.message); }
  };

  if (user?.role !== "admin") {
    return (
      <DashboardLayout title="Admin - Usuários">
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-destructive opacity-50 mx-auto mb-3" />
          <p className="text-muted-foreground">Acesso negado</p>
        </div>
      </DashboardLayout>
    );
  }

  const totalPages = data ? Math.ceil(data.total / 20) : 0;

  return (
    <DashboardLayout title="Admin - Usuários">
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Gerenciar Usuários</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {data?.total ?? 0} usuário{data?.total !== 1 ? "s" : ""} cadastrado{data?.total !== 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl bg-secondary/40" />)}
          </div>
        ) : data?.users && data.users.length > 0 ? (
          <>
            <div className="space-y-3">
              {data.users.map((u: any) => (
                <div key={u.id} className="glass-card rounded-xl p-4 flex items-center gap-3 border-border/60">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-lg flex-shrink-0">
                    {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{u.name ?? "Sem nome"}</span>
                      {u.role === "admin" && (
                        <Badge variant="outline" className="text-xs border-yellow-400/40 text-yellow-400 gap-1">
                          <Crown className="w-2.5 h-2.5" /> Admin
                        </Badge>
                      )}
                      {u.isBanned && (
                        <Badge variant="outline" className="text-xs border-destructive/40 text-destructive">Banido</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {u.email ?? "—"} • Cadastro: {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.id !== user?.id && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className={`text-xs h-7 gap-1 ${u.role === "admin" ? "border-yellow-400/40 text-yellow-400" : "border-border/60 text-muted-foreground"}`}>
                              <Crown className="w-3 h-3" />
                              {u.role === "admin" ? "Remover admin" : "Tornar admin"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">
                                {u.role === "admin" ? "Remover privilégios de admin?" : "Tornar administrador?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                {u.role === "admin"
                                  ? `"${u.name}" perderá acesso ao painel administrativo.`
                                  : `"${u.name}" terá acesso total ao painel administrativo.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border/60">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handlePromote(u.id, u.name ?? "Usuário", u.role === "admin" ? "user" : "admin")}
                                className="bg-primary text-primary-foreground"
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className={`text-xs h-7 gap-1 ${u.isBanned ? "text-primary hover:bg-primary/10" : "text-destructive hover:bg-destructive/10"}`}>
                              <Shield className="w-3 h-3" />
                              {u.isBanned ? "Desbanir" : "Banir"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-card border-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">
                                {u.isBanned ? "Desbanir usuário?" : "Banir usuário?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                {u.isBanned
                                  ? `"${u.name}" poderá acessar a plataforma novamente.`
                                  : `"${u.name}" não poderá mais acessar a plataforma.`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-border/60">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleBan(u.id, u.name ?? "Usuário", !u.isBanned)}
                                className={u.isBanned ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"}
                              >
                                {u.isBanned ? "Desbanir" : "Banir"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {u.id === user?.id && (
                      <span className="text-xs text-muted-foreground italic">Você</span>
                    )}
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
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum usuário encontrado</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
