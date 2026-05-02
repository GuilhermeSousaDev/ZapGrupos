import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import Header from "@/components/layout/Header";
import GroupCard from "@/components/GroupCard";
import { Search, Filter, TrendingUp, Clock, MousePointerClick, X } from "lucide-react";

export default function SearchPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  const initialQuery = params.get("q") ?? "";

  const [search, setSearch] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState<string | undefined>();
  const [sort, setSort] = useState<"rank" | "newest" | "clicks">("rank");
  const [page, setPage] = useState(1);

  const { data: categories } = trpc.categories.list.useQuery();
  const { data, isLoading } = trpc.groups.list.useQuery({
    search: search || undefined,
    categorySlug,
    sort,
    page,
    limit: 12,
  });

  const totalPages = data ? Math.ceil(data.total / 12) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputValue);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
          {search ? `Resultados para "${search}"` : "Explorar Grupos"}
        </h1>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Buscar grupos..."
                className="pl-10 bg-secondary/50 border-border/60 text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
              Buscar
            </Button>
          </form>

          <div className="flex gap-2">
            <Select
              value={categorySlug ?? "all"}
              onValueChange={(v) => { setCategorySlug(v === "all" ? undefined : v); setPage(1); }}
            >
              <SelectTrigger className="w-40 bg-secondary/50 border-border/60 text-foreground">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={(v) => { setSort(v as any); setPage(1); }}>
              <SelectTrigger className="w-40 bg-secondary/50 border-border/60 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="rank">
                  <span className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Relevância</span>
                </SelectItem>
                <SelectItem value="newest">
                  <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Mais recentes</span>
                </SelectItem>
                <SelectItem value="clicks">
                  <span className="flex items-center gap-2"><MousePointerClick className="w-3.5 h-3.5" /> Mais clicados</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters */}
        {(search || categorySlug) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {search && (
              <Badge variant="secondary" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
                Busca: {search}
                <button onClick={() => { setSearch(""); setInputValue(""); }}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {categorySlug && (
              <Badge variant="secondary" className="gap-1.5 bg-secondary/60 text-muted-foreground">
                {categories?.find((c) => c.slug === categorySlug)?.name}
                <button onClick={() => setCategorySlug(undefined)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results count */}
        {data && (
          <p className="text-sm text-muted-foreground mb-4">
            {data.total} grupo{data.total !== 1 ? "s" : ""} encontrado{data.total !== 1 ? "s" : ""}
          </p>
        )}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl bg-secondary/40" />
            ))}
          </div>
        ) : data?.groups && data.groups.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="border-border/60">
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="border-border/60">
                  Próxima
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-foreground mb-1">Nenhum grupo encontrado</p>
            <p className="text-sm">Tente outros termos ou explore por categoria</p>
          </div>
        )}
      </div>
    </div>
  );
}
