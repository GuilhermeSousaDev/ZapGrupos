import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module to avoid real DB calls in tests
vi.mock("./db", () => ({
  getAllCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Tecnologia", slug: "tecnologia", description: null, icon: "Code", color: "#25D366", groupCount: 0 },
  ]),
  getCategoryBySlug: vi.fn().mockResolvedValue(null),
  updateCategoryGroupCount: vi.fn().mockResolvedValue(undefined),
  getPublicGroups: vi.fn().mockResolvedValue({ groups: [], total: 0 }),
  recalcRankScore: vi.fn().mockResolvedValue(undefined),
  getGroupClicksHistory: vi.fn().mockResolvedValue([]),
  upsertSubscription: vi.fn().mockResolvedValue(undefined),
  getSubscriptionByStripeId: vi.fn().mockResolvedValue(null),
  getSubscriptionByStripeCustomerId: vi.fn().mockResolvedValue(null),
  getGroupReviews: vi.fn().mockResolvedValue([]),
  createReview: vi.fn().mockResolvedValue(undefined),
  getUserById: vi.fn().mockResolvedValue(null),
  PLAN_LIMITS: { free: { maxGroups: 1 }, starter: { maxGroups: 3 }, pro: { maxGroups: 5 }, premium: { maxGroups: 999 } },
  getGroupsByOwner: vi.fn().mockResolvedValue([]),
  getGroupById: vi.fn().mockResolvedValue(null),
  createGroup: vi.fn().mockResolvedValue(1),
  updateGroup: vi.fn().mockResolvedValue(undefined),
  deleteGroup: vi.fn().mockResolvedValue(undefined),
  getCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Tecnologia", slug: "tecnologia", description: null, icon: "Code", color: "#25D366", groupCount: 0 },
  ]),
  getGroupsByCategory: vi.fn().mockResolvedValue({ groups: [], total: 0 }),
  getFeaturedGroups: vi.fn().mockResolvedValue([]),
  searchGroups: vi.fn().mockResolvedValue({ groups: [], total: 0 }),
  getSubscriptionByUserId: vi.fn().mockResolvedValue(null),
  getUserNotifications: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  markAllNotificationsRead: vi.fn().mockResolvedValue(undefined),
  getPlatformStats: vi.fn().mockResolvedValue({
    totalUsers: 10, totalGroups: 5, activeGroups: 3, pendingGroups: 2, totalClicks: 100, paidSubscriptions: 2,
  }),
  getAllGroupsAdmin: vi.fn().mockResolvedValue({ groups: [], total: 0 }),
  getAllUsers: vi.fn().mockResolvedValue({ users: [], total: 0 }),
  banUser: vi.fn().mockResolvedValue(undefined),
  promoteUser: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
  updateGroupStatus: vi.fn().mockResolvedValue(undefined),
  getGroupMetrics: vi.fn().mockResolvedValue({ group: null, clickHistory: [] }),
  getRankedGroups: vi.fn().mockResolvedValue([]),
  recordClick: vi.fn().mockResolvedValue(undefined),
  recordView: vi.fn().mockResolvedValue(undefined),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserCtx(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@zapgrupos.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("auth", () => {
  it("me returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated users", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("test@zapgrupos.com");
  });
});

describe("categories", () => {
  it("list returns categories", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("slug");
  });
});

describe("groups", () => {
  it("featured returns array", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.groups.featured({ limit: 6 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("list with search returns groups and total", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.groups.list({ search: "tecnologia", page: 1, limit: 10 });
    expect(result).toHaveProperty("groups");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.groups)).toBe(true);
  });

  it("list by category returns groups and total", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.groups.list({ categorySlug: "tecnologia", page: 1, limit: 10 });
    expect(result).toHaveProperty("groups");
    expect(result).toHaveProperty("total");
  });
});

describe("dashboard", () => {
  it("myGroups requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.dashboard.myGroups()).rejects.toThrow();
  });

  it("myGroups returns empty array for new user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.dashboard.myGroups();
    expect(Array.isArray(result)).toBe(true);
  });

  it("subscription returns free plan for user without subscription", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.dashboard.subscription();
    expect(result).toHaveProperty("plan");
    expect(result.plan).toBe("free");
  });
});

describe("notifications", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.notifications.list()).rejects.toThrow();
  });

  it("list returns empty array for new user", async () => {
    const caller = appRouter.createCaller(createUserCtx());
    const result = await caller.notifications.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("admin", () => {
  it("stats requires admin role", async () => {
    const caller = appRouter.createCaller(createUserCtx("user"));
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("stats returns platform metrics for admin", async () => {
    const caller = appRouter.createCaller(createUserCtx("admin"));
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("totalUsers");
    expect(result).toHaveProperty("totalGroups");
    expect(result).toHaveProperty("pendingGroups");
    expect(result).toHaveProperty("totalClicks");
  });

  it("users requires admin role", async () => {
    const caller = appRouter.createCaller(createUserCtx("user"));
    await expect(caller.admin.users({ page: 1, limit: 10 })).rejects.toThrow();
  });

  it("users returns paginated list for admin", async () => {
    const caller = appRouter.createCaller(createUserCtx("admin"));
    const result = await caller.admin.users({ page: 1, limit: 10 });
    expect(result).toHaveProperty("users");
    expect(result).toHaveProperty("total");
  });
});
