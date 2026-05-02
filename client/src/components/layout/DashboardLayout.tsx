import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/_core/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { trpc } from "@/lib/trpc";
import {
  LayoutDashboard,
  MessageSquare,
  Plus,
  BarChart3,
  CreditCard,
  Bell,
  LogOut,
  Shield,
  ChevronRight,
  Home,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" />, label: "Visão Geral" },
  { href: "/dashboard/grupos", icon: <MessageSquare className="w-4 h-4" />, label: "Meus Grupos" },
  { href: "/dashboard/grupos/novo", icon: <Plus className="w-4 h-4" />, label: "Novo Grupo" },
  { href: "/dashboard/planos", icon: <CreditCard className="w-4 h-4" />, label: "Planos" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const { open: openAuthModal } = useAuthModal();

  const { data: notifications } = trpc.notifications.list.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  const { data: sub } = trpc.dashboard.subscription.useQuery(undefined, { enabled: isAuthenticated });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const plan = sub?.plan ?? "free";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center glass-card rounded-2xl p-8 max-w-sm">
          <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="font-display font-bold text-xl text-foreground mb-2">Acesso restrito</h2>
          <p className="text-muted-foreground text-sm mb-6">Faça login para acessar o dashboard.</p>
          <Button className="w-full bg-primary text-primary-foreground" onClick={() => openAuthModal("login")}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r border-border/50 bg-card/50 flex flex-col hidden md:flex">
        {/* Logo */}
        <div className="p-4 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">
              Zap<span className="text-primary">Grupos</span>
            </span>
          </Link>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 mt-0.5 ${planColors[plan]}`}
              >
                {planLabels[plan]}
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start gap-2.5 text-sm ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {item.icon}
                  {item.label}
                  {item.href === "/dashboard" && unreadCount > 0 && (
                    <Badge className="ml-auto bg-primary text-primary-foreground text-[10px] px-1.5 py-0 h-4">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}

          {user?.role === "admin" && (
            <>
              <div className="pt-3 pb-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2">Admin</p>
              </div>
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-full justify-start gap-2.5 text-sm ${
                    location.startsWith("/admin")
                      ? "bg-yellow-400/10 text-yellow-400 font-medium"
                      : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/5"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Painel Admin
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-border/50 space-y-0.5">
          <Link href="/">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2.5 text-sm text-muted-foreground hover:text-foreground">
              <Home className="w-4 h-4" />
              Ver site
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="w-full justify-start gap-2.5 text-sm text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border/50 flex items-center px-6 gap-4 glass sticky top-0 z-10">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          </Link>

          {/* Breadcrumb */}
          {title && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{title}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            {/* Notifications */}
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Mobile nav items */}
            <div className="flex md:hidden gap-1">
              {navItems.slice(0, 3).map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`${location === item.href ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {item.icon}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
