import { useState } from "react";
import { useParams } from "wouter";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import Header from "@/components/layout/Header";
import GroupCard from "@/components/GroupCard";
import { ChevronLeft, Filter, TrendingUp, Clock, MousePointerClick } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sort, setSort] = useState<"rank" | "newest" | "clicks">("rank");
  const [page, setPage] = useState(1);

  const { data: category } = trpc.categories.bySlug.useQuery({ slug: slug ?? "" });
  const { data, isLoading } = trpc.groups.list.useQuery({
    categorySlug: slug,
    sort,
    page,
    limit: 12,
  });

  const totalPages = data ? Math.ceil(data.total / 12) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Início
            </Button>
          </Link>
          <span>/</span>
          <span className="text-foreground">{category?.name ?? slug}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-1">
              Grupos de {category?.name ?? slug}
            </h1>
            {category?.description && (
              <p className="text-muted-foreground text-sm">{category.description}</p>
            )}
            {data && (
              <Badge variant="secondary" className="mt-2 bg-secondary/60 text-muted-foreground">
                {data.total} grupos encontrados
              </Badge>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={sort} onValueChange={(v) => { setSort(v as any); setPage(1); }}>
              <SelectTrigger className="w-44 bg-secondary/50 border-border/60 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="rank">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" /> Mais relevantes
                  </span>
                </SelectItem>
                <SelectItem value="newest">
                  <span className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Mais recentes
                  </span>
                </SelectItem>
                <SelectItem value="clicks">
                  <span className="flex items-center gap-2">
                    <MousePointerClick className="w-3.5 h-3.5" /> Mais clicados
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Groups Grid */}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-border/60"
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-border/60"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-secondary/40 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 opacity-30" />
            </div>
            <p className="font-medium text-foreground mb-1">Nenhum grupo nesta categoria ainda</p>
            <p className="text-sm mb-6">Seja o primeiro a cadastrar um grupo aqui!</p>
            <Link href="/dashboard/grupos/novo">
              <Button className="bg-primary text-primary-foreground">
                Cadastrar meu grupo
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
