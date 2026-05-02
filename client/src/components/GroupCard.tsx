import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Star,
  Users,
  MousePointerClick,
  Eye,
  ExternalLink,
  TrendingUp,
  Crown,
} from "lucide-react";
import type { Group, Category } from "../../../drizzle/schema";

interface GroupCardProps {
  group: Group & { category?: Category };
  showMetrics?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  Empregos: "💼",
  "Renda Extra": "💰",
  Criptomoedas: "₿",
  Cursos: "📚",
  Apostas: "🎯",
  Tecnologia: "💻",
  Negócios: "🏢",
  Entretenimento: "🎵",
  Saúde: "❤️",
  Relacionamentos: "👥",
};

export default function GroupCard({ group, showMetrics = false }: GroupCardProps) {
  const categoryIcon = CATEGORY_ICONS[group.category?.name ?? ""] ?? "📱";
  const tags = Array.isArray(group.tags) ? group.tags : [];

  return (
    <Card className="glass-card card-hover group overflow-hidden border-border/60 hover:border-primary/30">
      {/* Featured banner */}
      {group.isFeatured && (
        <div className="featured-badge px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
          <Crown className="w-3 h-3" />
          Grupo em Destaque
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl flex-shrink-0 border border-border/50">
            {group.imageUrl ? (
              <img
                src={group.imageUrl}
                alt={group.name}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              categoryIcon
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-foreground text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {group.name}
              </h3>
              {group.isFeatured && (
                <Star className="w-4 h-4 text-yellow-400 flex-shrink-0 fill-yellow-400" />
              )}
            </div>
            {group.category && (
              <span className="text-xs text-muted-foreground mt-0.5 block">
                {group.category.name}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {group.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
            {group.description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-secondary/60 text-muted-foreground border-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          {group.memberCount != null && group.memberCount > 0 && (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {group.memberCount.toLocaleString()}
            </span>
          )}
          <span className="flex items-center gap-1">
            <MousePointerClick className="w-3 h-3" />
            {group.totalClicks.toLocaleString()} cliques
          </span>
          {showMetrics && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {group.totalViews.toLocaleString()}
            </span>
          )}
          {group.rankScore > 100 && (
            <span className="flex items-center gap-1 text-primary">
              <TrendingUp className="w-3 h-3" />
              Trending
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/grupo/${group.id}`} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-border/60 hover:border-primary/40 hover:text-primary"
            >
              Ver detalhes
            </Button>
          </Link>
          <a
            href={group.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button
              size="sm"
              className="w-full text-xs bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
            >
              <ExternalLink className="w-3 h-3" />
              Entrar
            </Button>
          </a>
        </div>
      </div>
    </Card>
  );
}
