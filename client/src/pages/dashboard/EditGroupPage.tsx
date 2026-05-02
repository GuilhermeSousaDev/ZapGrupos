import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(3).max(150),
  description: z.string().max(1000).optional(),
  whatsappLink: z.string().url().refine(
    (v) => /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\//.test(v),
    "Use um link válido do WhatsApp"
  ),
  categoryId: z.string().min(1),
  memberCount: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditGroupPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const groupId = Number(id);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: group, isLoading } = trpc.groups.byId.useQuery({ id: groupId }, { enabled: !!groupId });
  const { data: categories } = trpc.categories.list.useQuery();
  const updateGroup = trpc.dashboard.updateGroup.useMutation();

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (group) {
      reset({
        name: group.name,
        description: group.description ?? "",
        whatsappLink: group.whatsappLink,
        categoryId: String(group.categoryId),
        memberCount: group.memberCount ? String(group.memberCount) : "",
      });
      setTags(Array.isArray(group.tags) ? group.tags : []);
    }
  }, [group, reset]);

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
      await updateGroup.mutateAsync({
        id: groupId,
        name: data.name,
        description: data.description,
        whatsappLink: data.whatsappLink,
        categoryId: Number(data.categoryId),
        memberCount: data.memberCount ? Number(data.memberCount) : undefined,
        tags,
      });
      toast.success("Grupo atualizado com sucesso!");
      navigate("/dashboard/grupos");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao atualizar grupo");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Editar Grupo">
        <div className="max-w-2xl space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 rounded-xl bg-secondary/40" />)}
        </div>
      </DashboardLayout>
    );
  }

  if (!group) {
    return (
      <DashboardLayout title="Editar Grupo">
        <div className="text-center py-20 text-muted-foreground">
          <p>Grupo não encontrado</p>
          <Button className="mt-4" onClick={() => navigate("/dashboard/grupos")}>Voltar</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Editar Grupo">
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Editar Grupo</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Atualize as informações do grupo "{group.name}"</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Nome do Grupo <span className="text-destructive">*</span></Label>
            <Input {...register("name")} className="bg-secondary/50 border-border/60 text-foreground focus:border-primary/60" />
            {errors.name && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Descrição</Label>
            <Textarea {...register("description")} rows={3} className="bg-secondary/50 border-border/60 text-foreground focus:border-primary/60 resize-none" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Link do WhatsApp <span className="text-destructive">*</span></Label>
            <Input {...register("whatsappLink")} placeholder="https://chat.whatsapp.com/..." className="bg-secondary/50 border-border/60 text-foreground focus:border-primary/60" />
            {errors.whatsappLink && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.whatsappLink.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Categoria <span className="text-destructive">*</span></Label>
            <Select defaultValue={String(group.categoryId)} onValueChange={(v) => setValue("categoryId", v)}>
              <SelectTrigger className="bg-secondary/50 border-border/60 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Número de Membros</Label>
            <Input type="number" {...register("memberCount")} placeholder="Ex: 250" className="bg-secondary/50 border-border/60 text-foreground focus:border-primary/60" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Tags (máx. 10)</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Adicionar tag..."
                className="bg-secondary/50 border-border/60 text-foreground focus:border-primary/60"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag} className="border-border/60 px-3">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1 bg-secondary/60 text-muted-foreground cursor-pointer" onClick={() => removeTag(tag)}>
                    #{tag} <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard/grupos")} className="border-border/60">
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              {isSubmitting ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
