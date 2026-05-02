import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, X, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").max(150),
  description: z.string().max(1000).optional(),
  whatsappLink: z.string().url("URL inválida").refine(
    (v) => /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\//.test(v),
    "Use um link válido do WhatsApp (chat.whatsapp.com ou wa.me)"
  ),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  memberCount: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateGroupPage() {
  const [, navigate] = useLocation();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: categories } = trpc.categories.list.useQuery();
  const { data: sub } = trpc.dashboard.subscription.useQuery();
  const createGroup = trpc.dashboard.createGroup.useMutation();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const onSubmit = async (data: FormData) => {
    try {
      const result = await createGroup.mutateAsync({
        name: data.name,
        description: data.description,
        whatsappLink: data.whatsappLink,
        categoryId: Number(data.categoryId),
        memberCount: data.memberCount ? Number(data.memberCount) : undefined,
        tags,
      });
      toast.success("Grupo cadastrado! Aguardando aprovação.");
      navigate("/dashboard/grupos");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao cadastrar grupo");
    }
  };

  const plan = sub?.plan ?? "free";

  return (
    <DashboardLayout title="Novo Grupo">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Cadastrar Novo Grupo</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Preencha as informações do seu grupo do WhatsApp
          </p>
        </div>

        {/* Plan info */}
        {plan === "free" && (
          <div className="glass rounded-xl p-4 flex items-start gap-3 border border-primary/20">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium">Plano Free — 1 grupo permitido</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Faça upgrade para o plano Pro e cadastre até 5 grupos com destaque e analytics.{" "}
                <a href="/dashboard/planos" className="text-primary hover:underline">Ver planos</a>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Nome do Grupo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ex: Vagas de Emprego em SP"
              className="bg-secondary/50 border-border/60 text-foreground placeholder:text-muted-foreground focus:border-primary/60"
            />
            {errors.name && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-sm font-medium text-foreground">
              Descrição
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descreva seu grupo, regras e o que os membros podem esperar..."
              rows={3}
              className="bg-secondary/50 border-border/60 text-foreground placeholder:text-muted-foreground focus:border-primary/60 resize-none"
            />
          </div>

          {/* WhatsApp Link */}
          <div className="space-y-1.5">
            <Label htmlFor="whatsappLink" className="text-sm font-medium text-foreground">
              Link do WhatsApp <span className="text-destructive">*</span>
            </Label>
            <Input
              id="whatsappLink"
              {...register("whatsappLink")}
              placeholder="https://chat.whatsapp.com/XXXXXXXXXX"
              className="bg-secondary/50 border-border/60 text-foreground placeholder:text-muted-foreground focus:border-primary/60"
            />
            {errors.whatsappLink && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.whatsappLink.message}</p>}
            <p className="text-xs text-muted-foreground">
              Use o link de convite do grupo. Formato: chat.whatsapp.com/... ou wa.me/...
            </p>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Categoria <span className="text-destructive">*</span>
            </Label>
            <Select onValueChange={(v) => setValue("categoryId", v)}>
              <SelectTrigger className="bg-secondary/50 border-border/60 text-foreground">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.categoryId.message}</p>}
          </div>

          {/* Member count */}
          <div className="space-y-1.5">
            <Label htmlFor="memberCount" className="text-sm font-medium text-foreground">
              Número de Membros (aproximado)
            </Label>
            <Input
              id="memberCount"
              type="number"
              {...register("memberCount")}
              placeholder="Ex: 250"
              className="bg-secondary/50 border-border/60 text-foreground placeholder:text-muted-foreground focus:border-primary/60"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Tags (máx. 10)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Ex: vagas, sp, clt"
                className="bg-secondary/50 border-border/60 text-foreground placeholder:text-muted-foreground focus:border-primary/60"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag} className="border-border/60 px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 bg-secondary/60 text-muted-foreground cursor-pointer" onClick={() => removeTag(tag)}>
                    #{tag}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/grupos")}
              className="border-border/60"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? "Cadastrando..." : "Cadastrar Grupo"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
