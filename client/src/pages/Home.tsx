import { useState } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import Header from "@/components/layout/Header";
import GroupCard from "@/components/GroupCard";
import {
  Search,
  ArrowRight,
  Briefcase,
  DollarSign,
  TrendingUp,
  BookOpen,
  Target,
  Code,
  Building,
  Music,
  Heart,
  Users,
  Zap,
  Star,
  ChevronRight,
  MessageSquare,
  Shield,
  BarChart3,
} from "lucide-react";

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase className="w-5 h-5" />,
  DollarSign: <DollarSign className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  BookOpen: <BookOpen className="w-5 h-5" />,
  Target: <Target className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Building: <Building className="w-5 h-5" />,
  Music: <Music className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
};

export default function Home() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: categories, isLoading: catsLoading } = trpc.categories.list.useQuery();
  const { data: featuredGroups, isLoading: featuredLoading } = trpc.groups.featured.useQuery({ limit: 6 });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="hero-gradient relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative py-20 md:py-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-muted-foreground mb-6 border border-border/50">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>A maior plataforma de grupos do WhatsApp do Brasil</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-bold text-4xl md:text-6xl text-foreground leading-tight mb-5">
              Encontre os melhores{" "}
              <span className="text-gradient">grupos de WhatsApp</span>
            </h1>

            <p className="text-muted-foreground text-lg md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed">
              Descubra comunidades incríveis por categoria, conecte-se com pessoas do seu nicho
              e promova seu grupo para milhares de pessoas.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar grupos por nome, categoria ou tag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/60 focus:border-primary/60 h-11 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 h-11 glow-green-sm"
              >
                Buscar
              </Button>
            </form>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" />
                <strong className="text-foreground">10.000+</strong> grupos
              </span>
              <span className="w-px h-4 bg-border" />
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400" />
                <strong className="text-foreground">50+</strong> categorias
              </span>
              <span className="w-px h-4 bg-border" />
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-primary" />
                <strong className="text-foreground">500k+</strong> membros
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 border-t border-border/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display font-bold text-2xl text-foreground mb-1">
                Explorar por Categoria
              </h2>
              <p className="text-muted-foreground text-sm">
                Encontre grupos no seu nicho de interesse
              </p>
            </div>
            <Link href="/busca">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1">
                Ver todas
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {catsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl bg-secondary/40" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categories?.map((cat) => (
                <Link key={cat.id} href={`/categoria/${cat.slug}`}>
                  <div
                    className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-all hover:-translate-y-0.5 group"
                    style={{ borderColor: `${cat.color}30` }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color ?? "#22c55e" }}
                    >
                      {cat.icon ? CATEGORY_ICON_MAP[cat.icon] ?? <MessageSquare className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                    </div>
                    <p className="font-medium text-sm text-foreground leading-tight">{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {cat.groupCount} grupos
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Groups */}
      <section className="py-16 border-t border-border/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                <h2 className="font-display font-bold text-2xl text-foreground">
                  Grupos em Destaque
                </h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Os grupos mais populares e verificados da plataforma
              </p>
            </div>
            <Link href="/busca">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 gap-1">
                Ver todos
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-56 rounded-xl bg-secondary/40" />
              ))}
            </div>
          ) : featuredGroups && featuredGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum grupo em destaque ainda</p>
              <p className="text-sm mt-1">Seja o primeiro a promover seu grupo!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA for group owners */}
      <section className="py-20 border-t border-border/30">
        <div className="container">
          <div className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 pointer-events-none" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
                  Para donos de grupos
                </Badge>
                <h2 className="font-display font-bold text-3xl text-foreground mb-3">
                  Promova seu grupo e{" "}
                  <span className="text-gradient">cresça mais rápido</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Cadastre seu grupo gratuitamente e alcance milhares de pessoas interessadas
                  no seu nicho. Com nossos planos pagos, apareça no topo das buscas e
                  receba estatísticas detalhadas.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link href="/dashboard/grupos/novo">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 glow-green-sm">
                      Cadastrar Grupo Grátis
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/dashboard/planos">
                    <Button variant="outline" className="border-border/60 hover:border-primary/40">
                      Ver Planos
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: <Users className="w-5 h-5" />, title: "Alcance Maior", desc: "Apareça para milhares de usuários" },
                  { icon: <TrendingUp className="w-5 h-5" />, title: "Ranking", desc: "Suba no ranking por cliques" },
                  { icon: <BarChart3 className="w-5 h-5" />, title: "Analytics", desc: "Métricas detalhadas do seu grupo" },
                  { icon: <Shield className="w-5 h-5" />, title: "Verificado", desc: "Selo de grupo verificado" },
                ].map((item) => (
                  <div key={item.title} className="glass rounded-xl p-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                      {item.icon}
                    </div>
                    <p className="font-semibold text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-foreground">
                Zap<span className="text-primary">Grupos</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2025 ZapGrupos. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
