import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Check,
  Zap,
  Star,
  Crown,
  CreditCard,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "R$19,90",
    period: "/mês",
    description: "Para quem está começando",
    icon: <Zap className="w-5 h-5" />,
    color: "text-blue-400",
    borderClass: "border-blue-400/30 hover:border-blue-400/60",
    badgeClass: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    features: [
      "Até 3 grupos cadastrados",
      "Aparece na listagem geral",
      "Estatísticas básicas (cliques)",
      "Suporte por e-mail",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "R$49,90",
    period: "/mês",
    description: "Para criadores sérios",
    icon: <Star className="w-5 h-5" />,
    color: "text-primary",
    borderClass: "border-primary/40 hover:border-primary/70",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    popular: true,
    features: [
      "Até 5 grupos cadastrados",
      "1 grupo em destaque",
      "Posição privilegiada no ranking",
      "Analytics completo (cliques + views)",
      "Selo de grupo verificado",
      "Suporte prioritário",
    ],
  },
  {
    key: "premium",
    name: "Premium",
    price: "R$99,90",
    period: "/mês",
    description: "Para agências e grandes criadores",
    icon: <Crown className="w-5 h-5" />,
    color: "text-yellow-400",
    borderClass: "border-yellow-400/30 hover:border-yellow-400/60",
    badgeClass: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    features: [
      "Grupos ilimitados",
      "3 grupos em destaque simultâneos",
      "Topo absoluto do ranking",
      "Analytics avançado com gráficos",
      "Selo premium exclusivo",
      "API de integração",
      "Gerente de conta dedicado",
    ],
  },
];

export default function PlansPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { data: sub } = trpc.dashboard.subscription.useQuery();
  const createCheckout = trpc.stripe.createCheckout.useMutation();
  const createPortal = trpc.stripe.createPortal.useMutation();

  const currentPlan = sub?.plan ?? "free";

  const handleUpgrade = async (planKey: string) => {
    setLoadingPlan(planKey);
    try {
      const result = await createCheckout.mutateAsync({ plan: planKey as any, origin: window.location.origin });
      if (result.url) window.location.href = result.url;
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao iniciar checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManage = async () => {
    setLoadingPlan("portal");
    try {
      const result = await createPortal.mutateAsync({ origin: window.location.origin });
      if (result.url) window.location.href = result.url;
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao abrir portal de assinatura");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <DashboardLayout title="Planos">
      <div className="max-w-5xl space-y-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Planos e Preços</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Escolha o plano ideal para promover seus grupos do WhatsApp
          </p>
        </div>

        {/* Current plan */}
        {currentPlan !== "free" && (
          <div className="glass rounded-xl p-4 flex items-center justify-between border border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Plano atual: <span className="text-primary capitalize">{currentPlan}</span>
                </p>

              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManage}
              disabled={loadingPlan === "portal"}
              className="border-border/60 gap-1.5"
            >
              {loadingPlan === "portal" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
              Gerenciar assinatura
            </Button>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.key;
            const isLoading = loadingPlan === plan.key;

            return (
              <Card
                key={plan.key}
                className={`glass-card relative overflow-hidden transition-all duration-300 ${plan.borderClass} ${plan.popular ? "scale-[1.02]" : ""}`}
              >
                {plan.popular && (
                  <div className="featured-badge text-xs font-semibold px-3 py-1 text-center">
                    Mais Popular
                  </div>
                )}

                <div className="p-6">
                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.badgeClass}`}>
                      {plan.icon}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className={`font-display font-bold text-3xl ${plan.color}`}>{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.color}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full border-border/60 text-muted-foreground cursor-default"
                      disabled
                    >
                      Plano Atual
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={!!loadingPlan}
                      className={`w-full gap-2 ${
                        plan.popular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Aguarde...</>
                      ) : (
                        <>Assinar {plan.name}</>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Free plan note */}
        <div className="glass rounded-xl p-4 flex items-start gap-3 border border-border/40">
          <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Plano Free:</strong> Cadastre 1 grupo gratuitamente.
            Sem destaque, sem analytics avançado. Faça upgrade a qualquer momento para crescer mais rápido.
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-lg text-foreground">Perguntas Frequentes</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { q: "Posso cancelar a qualquer momento?", a: "Sim! Você pode cancelar sua assinatura a qualquer momento pelo portal de assinatura. O acesso continua até o fim do período pago." },
              { q: "Como funciona o destaque?", a: "Grupos em destaque aparecem no topo das listagens e na seção especial da home, recebendo muito mais visibilidade." },
              { q: "O pagamento é seguro?", a: "Sim! Usamos o Stripe, a plataforma de pagamentos mais confiável do mundo, com criptografia de ponta a ponta." },
              { q: "Posso mudar de plano?", a: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento. A diferença de valor é calculada proporcionalmente." },
            ].map((item) => (
              <div key={item.q} className="glass-card rounded-xl p-4 border-border/60">
                <p className="font-medium text-sm text-foreground mb-1">{item.q}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
