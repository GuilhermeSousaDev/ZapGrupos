import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { trpc } from "@/lib/trpc";
import {
  MessageSquare,
  LayoutDashboard,
  LogOut,
  Shield,
  Bell,
  Menu,
  X,
  Plus,
  ChevronDown,
} from "lucide-react";

export default function Header() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { open: openAuthModal } = useAuthModal();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: notifications } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: subscription } = trpc.dashboard.subscription.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;
  const plan = subscription?.plan ?? "free";

  const planColors: Record<string, string> = {
    free: "text-muted-foreground border-border/60",
    starter: "text-blue-400 border-blue-400/40",
    pro: "text-primary border-primary/40",
    premium: "text-yellow-400 border-yellow-400/40",
  };

  const planLabels: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    premium: "Premium",
  };

  const isActive = (path: string) =>
    location === path || location.startsWith(path + "/");

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center glow-green-sm group-hover:glow-green transition-all">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              Zap<span className="text-primary">Grupos</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className={
                  isActive("/") && location === "/"
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                Início
              </Button>
            </Link>
            <Link href="/busca">
              <Button
                variant="ghost"
                size="sm"
                className={
                  isActive("/busca")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }
              >
                Explorar
              </Button>
            </Link>
            <Link href="/categoria/empregos">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Empregos
              </Button>
            </Link>
            <Link href="/categoria/criptomoedas">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Cripto
              </Button>
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <>
                {/* Notifications */}
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-foreground"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Add Group CTA */}
                <Link href="/dashboard/grupos/novo">
                  <Button
                    size="sm"
                    className="hidden sm:flex gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar Grupo
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-2 text-foreground"
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                          {user.name?.charAt(0).toUpperCase() ?? "U"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
                        {user.name?.split(" ")[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-card border-border"
                  >
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard/planos"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${planColors[plan]}`}
                        >
                          {planLabels[plan]}
                        </Badge>
                        Meu Plano
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 cursor-pointer text-yellow-400"
                          >
                            <Shield className="w-4 h-4" />
                            Painel Admin
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="flex items-center gap-2 text-destructive cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => openAuthModal("login")}
                >
                  Entrar
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm"
                  onClick={() => openAuthModal("register")}
                >
                  Cadastrar Grupo
                </Button>
              </>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/50 py-3 space-y-1">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
              >
                Início
              </Button>
            </Link>
            <Link href="/busca" onClick={() => setMobileOpen(false)}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
              >
                Explorar Grupos
              </Button>
            </Link>
            <Link
              href="/categoria/empregos"
              onClick={() => setMobileOpen(false)}
            >
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
              >
                Empregos
              </Button>
            </Link>
            {isAuthenticated ? (
              <Link
                href="/dashboard/grupos/novo"
                onClick={() => setMobileOpen(false)}
              >
                <Button
                  size="sm"
                  className="w-full mt-2 bg-primary text-primary-foreground"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Cadastrar Grupo
                </Button>
              </Link>
            ) : (
              <Button
                size="sm"
                className="w-full mt-2 bg-primary text-primary-foreground"
                onClick={() => {
                  setMobileOpen(false);
                  openAuthModal("register");
                }}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Cadastrar Grupo
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
