# ZapGrupos - TODO

## Fase 1: Banco de Dados e Schema
- [x] Criar todo.md
- [x] Definir schema Drizzle: users, categories, groups, clicks, views, subscriptions, reviews, notifications
- [x] Gerar e aplicar migração SQL
- [x] Seed de 10 categorias iniciais

## Fase 2: Backend (tRPC Routers)
- [x] Router de categorias (listar)
- [x] Router de grupos (listar público, buscar, detalhe, criar, editar, remover, clique, visualização, avaliações)
- [x] Router de assinaturas (planos, status, criar checkout Stripe, portal Stripe)
- [x] Router de admin (métricas gerais, gestão de usuários, moderação, destaque)
- [x] Router de ranking (grupos em destaque, mais clicados)
- [x] Middleware de roles (adminProcedure)
- [x] Webhook Stripe (stripeWebhook.ts)
- [x] Router de notificações (listar, marcar lida, marcar todas lidas)

## Fase 3: Páginas Públicas
- [x] Layout global com Header e footer elegantes
- [x] Página Home: hero, busca, categorias populares, grupos em destaque
- [x] Página de Categoria: listagem de grupos com filtros e ordenação
- [x] Página de Detalhe do Grupo: info, botão entrar WhatsApp, métricas públicas
- [x] Página de Busca: resultados com filtros
- [x] SEO: meta tags no index.html, lang pt-BR, Open Graph

## Fase 4: Dashboard do Dono de Grupo
- [x] Layout DashboardLayout para área autenticada com sidebar
- [x] Página Visão Geral (DashboardPage): stats, notificações, grupos recentes
- [x] Página Meus Grupos (MyGroupsPage): listagem, status, métricas rápidas, ações
- [x] Formulário Criar Grupo (CreateGroupPage): nome, descrição, categoria, link WhatsApp, tags
- [x] Formulário Editar Grupo (EditGroupPage): todos os campos editáveis
- [x] Validação de link WhatsApp válido (regex chat.whatsapp.com / wa.me)
- [x] Página de Métricas (MetricsPage): cliques, visualizações, ranking, gráfico histórico
- [x] Página de Planos (PlansPage): comparativo Starter/Pro/Premium com CTA de upgrade

## Fase 5: Integração Stripe
- [ ] Configurar produtos e preços no Stripe Dashboard (requer chaves do usuário)
- [x] Endpoint de checkout (criar sessão Stripe com plano)
- [x] Endpoint de portal Stripe (gerenciar assinatura)
- [x] Webhook Stripe: atualizar status de assinatura automaticamente
- [x] Controle de limites por plano (PLAN_LIMITS no db.ts)

## Fase 6: Painel Administrativo
- [x] Página Admin Dashboard: métricas gerais, ações rápidas, grupos pendentes
- [x] Moderação de grupos (AdminGroups): aprovar, rejeitar, banir, destacar
- [x] Gestão de usuários (AdminUsers): listar, promover a admin, banir/desbanir
- [x] Controle de acesso por role (adminProcedure no backend, verificação no frontend)

## Fase 7: Funcionalidades Avançadas
- [x] Sistema de ranking: score baseado em cliques + destaque pago + avaliações (recalcRankScore)
- [x] Anti-spam: limite de grupos por plano, verificação de link WhatsApp
- [x] Notificações ao dono: novos cliques, grupo aprovado/rejeitado/banido

## Fase 8: Polimento e Testes
- [x] Design system premium: cores OKLCH, tipografia Sora + Inter, espaçamentos
- [x] Classes utilitárias: glass, glass-card, text-gradient, featured-badge
- [x] Responsividade mobile-first (sidebar colapsável no mobile)
- [x] Testes Vitest: 16 testes passando (auth, categories, groups, dashboard, notifications, admin)
- [x] SEO: meta tags, Open Graph, Twitter Card, lang pt-BR, keywords
- [x] Configurar Stripe secrets (injetados automaticamente pelo sistema)
- [x] Checkpoint final
