import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Search, Download, ExternalLink, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface ScrapedGroup {
  name: string;
  description?: string;
  whatsappLink: string;
  imageUrl?: string;
}

export default function AdminScraper() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState("10");
  const [categoryId, setCategoryId] = useState<string>("");
  const [preview, setPreview] = useState<ScrapedGroup[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const { data: categoriesData } = trpc.categories.list.useQuery();

  const scrape = trpc.admin.scrapePreview.useMutation({
    onSuccess: ({ groups }) => {
      setPreview(groups);
      setSelected(new Set(groups.map((_, i) => i)));
      if (groups.length === 0) toast.info("Nenhum grupo encontrado para essa busca.");
    },
    onError: (e) => toast.error(e.message),
  });

  const importGroups = trpc.admin.importScraped.useMutation({
    onSuccess: ({ imported }) => {
      toast.success(`${imported} grupo(s) importado(s) com sucesso!`);
      setPreview([]);
      setSelected(new Set());
      navigate("/admin/grupos");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!user || user.role !== "admin") return null;

  function toggleSelect(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === preview.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(preview.map((_, i) => i)));
    }
  }

  function handleImport() {
    if (!categoryId) return toast.error("Selecione uma categoria.");
    const toImport = preview.filter((_, i) => selected.has(i));
    if (toImport.length === 0) return toast.error("Nenhum grupo selecionado.");
    importGroups.mutate({ categoryId: Number(categoryId), groups: toImport });
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold">Scraping de Grupos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Raspa grupos do <span className="text-foreground font-medium">gruposdewhatss.com.br</span> por categoria. Os grupos são importados com status{" "}
            <Badge variant="outline" className="border-yellow-400/40 text-yellow-400 text-xs">pendente</Badge> para revisão.
          </p>
        </div>

        {/* Search form */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Configurar busca
          </h2>
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Categoria: amizades, jogos, fitness, receitas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim().length >= 2) {
                  scrape.mutate({ query: query.trim(), limit: Number(limit) });
                }
              }}
              className="flex-1 min-w-[200px]"
            />
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 30].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} grupos
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => scrape.mutate({ query: query.trim(), limit: Number(limit) })}
              disabled={query.trim().length < 2 || scrape.isPending}
            >
              <Search className="w-4 h-4 mr-2" />
              {scrape.isPending ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>

        {/* Loading skeleton */}
        {scrape.isPending && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        )}

        {/* Preview results */}
        {!scrape.isPending && preview.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {preview.length} grupo(s) encontrado(s) — {selected.size} selecionado(s)
              </span>
              <button
                onClick={toggleAll}
                className="text-sm text-primary hover:underline"
              >
                {selected.size === preview.length ? "Desmarcar todos" : "Selecionar todos"}
              </button>
            </div>

            <div className="space-y-2">
              {preview.map((g, i) => (
                <button
                  key={i}
                  onClick={() => toggleSelect(i)}
                  className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors ${
                    selected.has(i)
                      ? "border-primary/50 bg-primary/5"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  {selected.has(i) ? (
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  )}

                  {g.imageUrl && (
                    <img
                      src={g.imageUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{g.name}</p>
                    {g.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {g.description}
                      </p>
                    )}
                    <a
                      href={g.whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      {g.whatsappLink.replace("https://", "")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </button>
              ))}
            </div>

            {/* Import bar */}
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleImport}
                disabled={selected.size === 0 || !categoryId || importGroups.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                {importGroups.isPending
                  ? "Importando..."
                  : `Importar ${selected.size} grupo(s)`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
