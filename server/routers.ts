import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { hashPassword, verifyPassword } from "./_core/auth";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  PLAN_LIMITS,
  PlanType,
  banUser,
  createGroup,
  createNotification,
  createReview,
  createUserWithPassword,
  deleteGroup,
  getAllCategories,
  getAllGroupsAdmin,
  getAllUsers,
  getCategoryBySlug,
  getFeaturedGroups,
  getGroupById,
  getGroupClicksHistory,
  getGroupReviews,
  getGroupsByOwner,
  getPlatformStats,
  getPublicGroups,
  getSubscriptionByStripeCustomerId,
  getSubscriptionByStripeId,
  getSubscriptionByUserId,
  getUserByEmail,
  getUserById,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  promoteUser,
  recalcRankScore,
  recordClick,
  recordView,
  updateCategoryGroupCount,
  updateGroup,
  updateGroupStatus,
  updateUserGroupsVerified,
  upsertSubscription,
} from "./db";
import { nanoid } from "nanoid";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Acesso restrito a administradores.",
    });
  }
  return next({ ctx });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function validateWhatsAppLink(link: string): boolean {
  return /^https?:\/\/(chat\.whatsapp\.com|wa\.me)\/[A-Za-z0-9_-]+/.test(link);
}

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    login: publicProcedure
      .input(z.object({ email: z.email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await getUserByEmail(input.email);
        if (
          !user ||
          !user.passwordHash ||
          !verifyPassword(input.password, user.passwordHash)
        ) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Email ou senha inválidos.",
          });
        }
        if (user.isBanned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Sua conta foi suspensa.",
          });
        }
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true };
      }),

    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2).max(100),
          email: z.email(),
          password: z
            .string()
            .min(8, "A senha deve ter no mínimo 8 caracteres"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const existing = await getUserByEmail(input.email);
        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este email já está cadastrado.",
          });
        }
        const openId = nanoid();
        const role =
          ENV.ownerEmail && input.email === ENV.ownerEmail ? "admin" : "user";
        await createUserWithPassword({
          openId,
          name: input.name,
          email: input.email,
          passwordHash: hashPassword(input.password),
          role,
        });
        const user = await getUserByEmail(input.email);
        if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const token = await sdk.createSessionToken(user.openId, {
          name: user.name ?? "",
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });
        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Categories ────────────────────────────────────────────────────────────
  categories: router({
    list: publicProcedure.query(() => getAllCategories()),
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => getCategoryBySlug(input.slug)),
  }),

  // ── Groups (public) ───────────────────────────────────────────────────────
  groups: router({
    list: publicProcedure
      .input(
        z.object({
          categorySlug: z.string().optional(),
          search: z.string().optional(),
          page: z.number().default(1),
          limit: z.number().default(12),
          sort: z.enum(["rank", "newest", "clicks"]).default("rank"),
        })
      )
      .query(({ input }) => getPublicGroups(input)),

    featured: publicProcedure
      .input(z.object({ limit: z.number().default(6) }))
      .query(({ input }) => getFeaturedGroups(input.limit)),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const group = await getGroupById(input.id);
        if (!group || group.status !== "active") {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Grupo não encontrado.",
          });
        }
        const category = group.categoryId ? await getCategoryBySlug("") : null;
        const cats = await getAllCategories();
        const cat = cats.find(c => c.id === group.categoryId);
        return { ...group, category: cat };
      }),

    click: publicProcedure
      .input(z.object({ groupId: z.number(), ipHash: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await recordClick(input.groupId, ctx.user?.id, input.ipHash);
        // Notify owner
        const group = await getGroupById(input.groupId);
        if (group) {
          await createNotification({
            userId: group.ownerId,
            type: "new_click",
            title: "Novo clique no seu grupo!",
            message: `Seu grupo "${group.name}" recebeu um novo clique.`,
            groupId: group.id,
          });
        }
        return { success: true };
      }),

    view: publicProcedure
      .input(z.object({ groupId: z.number(), ipHash: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await recordView(input.groupId, ctx.user?.id, input.ipHash);
        return { success: true };
      }),

    reviews: publicProcedure
      .input(z.object({ groupId: z.number() }))
      .query(({ input }) => getGroupReviews(input.groupId)),

    addReview: protectedProcedure
      .input(
        z.object({
          groupId: z.number(),
          rating: z.number().min(1).max(5),
          comment: z.string().max(500).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        await createReview({
          groupId: input.groupId,
          userId: ctx.user.id,
          rating: input.rating,
          comment: input.comment,
        });
        return { success: true };
      }),
  }),

  // ── Dashboard (owner) ─────────────────────────────────────────────────────
  dashboard: router({
    myGroups: protectedProcedure.query(async ({ ctx }) => {
      const myGroups = await getGroupsByOwner(ctx.user.id);
      const cats = await getAllCategories();
      return myGroups.map(g => ({
        ...g,
        category: cats.find(c => c.id === g.categoryId),
      }));
    }),

    groupMetrics: protectedProcedure
      .input(z.object({ groupId: z.number(), days: z.number().default(30) }))
      .query(async ({ input, ctx }) => {
        const group = await getGroupById(input.groupId);
        if (!group || group.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const sub = await getSubscriptionByUserId(ctx.user.id);
        const plan = (sub?.plan ?? "free") as PlanType;
        if (PLAN_LIMITS[plan].analytics === "none") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Analytics disponível a partir do plano Starter." });
        }
        const history = await getGroupClicksHistory(input.groupId, input.days);
        return { group, clickHistory: history, includeViews: PLAN_LIMITS[plan].analytics === "full" };
      }),

    createGroup: protectedProcedure
      .input(
        z.object({
          name: z.string().min(3).max(150),
          description: z.string().max(1000).optional(),
          whatsappLink: z.string().url(),
          categoryId: z.number(),
          imageUrl: z.string().url().optional(),
          tags: z.array(z.string()).max(10).optional(),
          memberCount: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!validateWhatsAppLink(input.whatsappLink)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Link do WhatsApp inválido. Use links do tipo chat.whatsapp.com ou wa.me",
          });
        }

        // Check plan limits
        const sub = await getSubscriptionByUserId(ctx.user.id);
        const plan = (sub?.plan ?? "free") as PlanType;
        const limits = PLAN_LIMITS[plan];
        const myGroups = await getGroupsByOwner(ctx.user.id);
        const activeCount = myGroups.filter(
          g => g.status !== "banned" && g.status !== "rejected"
        ).length;

        if (limits.maxGroups !== null && activeCount >= limits.maxGroups) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Seu plano ${plan} permite no máximo ${limits.maxGroups} grupo(s). Faça upgrade para adicionar mais.`,
          });
        }

        const id = await createGroup({
          ...input,
          ownerId: ctx.user.id,
          status: "pending",
          tags: input.tags ?? [],
        });

        await updateCategoryGroupCount(input.categoryId, 1);
        return { id };
      }),

    updateGroup: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(3).max(150).optional(),
          description: z.string().max(1000).optional(),
          whatsappLink: z.string().url().optional(),
          categoryId: z.number().optional(),
          imageUrl: z.string().url().optional().nullable(),
          tags: z.array(z.string()).max(10).optional(),
          memberCount: z.number().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const group = await getGroupById(id);
        if (!group || group.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (data.whatsappLink && !validateWhatsAppLink(data.whatsappLink)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Link do WhatsApp inválido.",
          });
        }
        // Re-submit for approval if link changed
        const updateData: any = { ...data };
        if (data.whatsappLink && data.whatsappLink !== group.whatsappLink) {
          updateData.status = "pending";
        }
        await updateGroup(id, updateData);
        return { success: true };
      }),

    deleteGroup: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const group = await getGroupById(input.id);
        if (!group || group.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deleteGroup(input.id);
        await updateCategoryGroupCount(group.categoryId, -1);
        return { success: true };
      }),

    setGroupFeatured: protectedProcedure
      .input(z.object({ groupId: z.number(), featured: z.boolean() }))
      .mutation(async ({ input, ctx }) => {
        const group = await getGroupById(input.groupId);
        if (!group || group.ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        if (group.status !== "active") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Apenas grupos ativos podem ser colocados em destaque." });
        }
        const sub = await getSubscriptionByUserId(ctx.user.id);
        const plan = (sub?.plan ?? "free") as PlanType;
        const limits = PLAN_LIMITS[plan];
        if (input.featured) {
          if (limits.maxFeatured === 0) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Seu plano não permite grupos em destaque. Faça upgrade para Pro ou Premium." });
          }
          const myGroups = await getGroupsByOwner(ctx.user.id);
          const featuredCount = myGroups.filter(g => g.isFeatured && g.id !== input.groupId).length;
          if (featuredCount >= limits.maxFeatured) {
            throw new TRPCError({ code: "FORBIDDEN", message: `Seu plano permite no máximo ${limits.maxFeatured} grupo(s) em destaque.` });
          }
        }
        await updateGroup(input.groupId, { isFeatured: input.featured });
        await recalcRankScore(input.groupId);
        return { success: true };
      }),

    subscription: protectedProcedure.query(async ({ ctx }) => {
      const sub = await getSubscriptionByUserId(ctx.user.id);
      const plan = ((sub?.plan ?? "free") as PlanType);
      return {
        ...(sub ?? { plan: "free", status: "active" }),
        limits: PLAN_LIMITS[plan],
      };
    }),
  }),

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.query(({ ctx }) =>
      getUserNotifications(ctx.user.id)
    ),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input, ctx }) =>
        markNotificationRead(input.id, ctx.user.id)
      ),
    markAllRead: protectedProcedure.mutation(({ ctx }) =>
      markAllNotificationsRead(ctx.user.id)
    ),
  }),

  // ── Stripe / Subscriptions ────────────────────────────────────────────────
  stripe: router({
    createCheckout: protectedProcedure
      .input(
        z.object({
          plan: z.enum(["starter", "pro", "premium"]),
          origin: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const stripe = await import("stripe").then(
          m => new m.default(process.env.STRIPE_SECRET_KEY ?? "")
        );
        const priceIds: Record<string, string> = {
          starter: process.env.STRIPE_PRICE_STARTER ?? "",
          pro: process.env.STRIPE_PRICE_PRO ?? "",
          premium: process.env.STRIPE_PRICE_PREMIUM ?? "",
        };
        const priceId = priceIds[input.plan];
        if (!priceId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Plano inválido ou não configurado.",
          });
        }

        let customerId: string | undefined;
        const existingSub = await getSubscriptionByUserId(ctx.user.id);

        // Upgrade / downgrade: update existing subscription instead of new checkout
        if (existingSub?.stripeSubscriptionId && existingSub.status === "active") {
          const subscription = await stripe.subscriptions.retrieve(
            existingSub.stripeSubscriptionId
          );
          const currentItem = subscription.items.data[0];

          if (currentItem?.price.id === priceId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Você já assina este plano.",
            });
          }

          await stripe.subscriptions.update(existingSub.stripeSubscriptionId, {
            items: [{ id: currentItem?.id, price: priceId }],
            proration_behavior: "create_prorations",
            metadata: { userId: String(ctx.user.id), plan: input.plan },
          });

          // Return success URL directly — webhook will sync the DB
          return { url: `${input.origin}/dashboard/planos?success=true` };
        }

        if (existingSub?.stripeCustomerId) {
          customerId = existingSub.stripeCustomerId;
        } else {
          const customer = await stripe.customers.create({
            email: ctx.user.email ?? undefined,
            name: ctx.user.name ?? undefined,
            metadata: { userId: String(ctx.user.id) },
          });
          customerId = customer.id;
        }

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `${input.origin}/dashboard/planos?success=true`,
          cancel_url: `${input.origin}/dashboard/planos?canceled=true`,
          metadata: { userId: String(ctx.user.id), plan: input.plan },
        });

        return { url: session.url };
      }),

    createPortal: protectedProcedure
      .input(z.object({ origin: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const stripe = await import("stripe").then(
          m => new m.default(process.env.STRIPE_SECRET_KEY ?? "")
        );
        const sub = await getSubscriptionByUserId(ctx.user.id);
        if (!sub?.stripeCustomerId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Nenhuma assinatura encontrada.",
          });
        }
        const session = await stripe.billingPortal.sessions.create({
          customer: sub.stripeCustomerId,
          return_url: `${input.origin}/dashboard/planos`,
        });
        return { url: session.url };
      }),
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(() => getPlatformStats()),

    groups: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          page: z.number().default(1),
          limit: z.number().default(20),
        })
      )
      .query(({ input }) => getAllGroupsAdmin(input)),

    approveGroup: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const group = await getGroupById(input.id);
        if (!group) throw new TRPCError({ code: "NOT_FOUND" });
        await updateGroupStatus(input.id, "active");
        await createNotification({
          userId: group.ownerId,
          type: "group_approved",
          title: "Grupo aprovado!",
          message: `Seu grupo "${group.name}" foi aprovado e está visível na plataforma.`,
          groupId: group.id,
        });
        return { success: true };
      }),

    rejectGroup: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const group = await getGroupById(input.id);
        if (!group) throw new TRPCError({ code: "NOT_FOUND" });
        await updateGroupStatus(input.id, "rejected");
        await createNotification({
          userId: group.ownerId,
          type: "group_rejected",
          title: "Grupo rejeitado",
          message: `Seu grupo "${group.name}" foi rejeitado. Edite e reenvie para aprovação.`,
          groupId: group.id,
        });
        return { success: true };
      }),

    banGroup: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const group = await getGroupById(input.id);
        if (!group) throw new TRPCError({ code: "NOT_FOUND" });
        await updateGroupStatus(input.id, "banned");
        await createNotification({
          userId: group.ownerId,
          type: "group_banned",
          title: "Grupo banido",
          message: `Seu grupo "${group.name}" foi banido por violar os termos de uso.`,
          groupId: group.id,
        });
        return { success: true };
      }),

    featureGroup: adminProcedure
      .input(
        z.object({
          id: z.number(),
          featured: z.boolean(),
          days: z.number().default(30),
        })
      )
      .mutation(async ({ input }) => {
        const featuredUntil = input.featured
          ? new Date(Date.now() + input.days * 24 * 60 * 60 * 1000)
          : null;
        await updateGroup(input.id, {
          isFeatured: input.featured,
          featuredUntil: featuredUntil ?? undefined,
        });
        return { success: true };
      }),

    users: adminProcedure
      .input(
        z.object({ page: z.number().default(1), limit: z.number().default(20) })
      )
      .query(({ input }) => getAllUsers(input.page, input.limit)),

    banUser: adminProcedure
      .input(z.object({ id: z.number(), banned: z.boolean() }))
      .mutation(({ input }) => banUser(input.id, input.banned)),

    promoteUser: adminProcedure
      .input(z.object({ id: z.number(), role: z.enum(["user", "admin"]) }))
      .mutation(({ input }) => promoteUser(input.id, input.role)),
  }),
});

export type AppRouter = typeof appRouter;
