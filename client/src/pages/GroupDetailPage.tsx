import { useEffect } from "react";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import Header from "@/components/layout/Header";
import {
  ExternalLink,
  ChevronLeft,
  Users,
  MousePointerClick,
  Eye,
  Star,
  Crown,
  Share2,
  MessageSquare,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);

  const { data, isLoading } = trpc.groups.byId.useQuery({ id: groupId }, { enabled: !!groupId });
  const { data: reviews } = trpc.groups.reviews.useQuery({ groupId }, { enabled: !!groupId });
  const viewMutation = trpc.groups.view.useMutation();
  const clickMutation = trpc.groups.click.useMutation();

  useEffect(() => {
    if (groupId) {
      viewMutation.mutate({ groupId });
    }
  }, [groupId]);

  const handleJoin = () => {
    if (data) {
      clickMutation.mutate({ groupId });
      window.open(data.whatsappLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: data?.name, url: window.location.href });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-6 bg-secondary/40" />
          <Skeleton className="h-64 rounded-2xl bg-secondary/40" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h2 className="font-display font-bold text-xl text-foreground mb-2">Grupo não encontrado</h2>
          <p className="text-muted-foreground mb-6">Este grupo pode ter sido removido ou não está disponível.</p>
          <Link href="/">
            <Button className="bg-primary text-primary-foreground">Voltar ao início</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tags = Array.isArray(data.tags) ? data.tags : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-8 max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Início
            </Button>
          </Link>
          {data.category && (
            <>
              <span>/</span>
              <Link href={`/categoria/${data.category.slug}`}>
                <Button variant="ghost" size="sm" className="h-auto p-0 text-muted-foreground hover:text-foreground">
                  {data.category.name}
                </Button>
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-32">{data.name}</span>
        </div>

        {/* Main Card */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Featured Banner */}
          {data.isFeatured && (
            <div className="featured-badge px-4 py-2 flex items-center gap-2 text-sm font-semibold">
              <Crown className="w-4 h-4" />
              Grupo em Destaque
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center text-3xl flex-shrink-0 border border-border/50">
                {data.imageUrl ? (
                  <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  "📱"
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <h1 className="font-display font-bold text-2xl text-foreground leading-tight">
                    {data.name}
                  </h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleShare}
                    className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                {data.category && (
                  <Link href={`/categoria/${data.category.slug}`}>
                    <Badge
                      variant="secondary"
                      className="mt-1.5 bg-secondary/60 hover:bg-secondary cursor-pointer"
                    >
                      {data.category.name}
                    </Badge>
                  </Link>
                )}
              </div>
            </div>

            {/* Description */}
            {data.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{data.description}</p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border/60 text-muted-foreground text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: <MousePointerClick className="w-4 h-4" />, value: data.totalClicks.toLocaleString(), label: "Cliques" },
                { icon: <Eye className="w-4 h-4" />, value: data.totalViews.toLocaleString(), label: "Visualizações" },
                { icon: <Users className="w-4 h-4" />, value: data.memberCount?.toLocaleString() ?? "—", label: "Membros" },
                { icon: <Star className="w-4 h-4" />, value: avgRating > 0 ? avgRating.toFixed(1) : "—", label: "Avaliação" },
              ].map((stat) => (
                <div key={stat.label} className="glass rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center text-primary mb-1">{stat.icon}</div>
                  <p className="font-display font-bold text-lg text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Join Button */}
            <Button
              onClick={handleJoin}
              size="lg"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-green text-base font-semibold gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Entrar no Grupo do WhatsApp
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-3">
              Ao entrar, você será redirecionado para o WhatsApp.
            </p>
          </div>
        </div>

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div className="mt-6 glass-card rounded-2xl p-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Avaliações ({reviews.length})
            </h2>
            <div className="space-y-3">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="glass rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Cadastrado em {new Date(data.createdAt).toLocaleDateString("pt-BR")}
          </span>
          {data.isFeatured && (
            <span className="flex items-center gap-1 text-primary">
              <TrendingUp className="w-3 h-3" />
              Grupo em destaque
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
