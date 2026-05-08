import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Category,
  Click,
  Group,
  InsertCategory,
  InsertGroup,
  InsertNotification,
  InsertReview,
  InsertSubscription,
  InsertUser,
  Notification,
  Review,
  Subscription,
  User,
  categories,
  clicks,
  groups,
  notifications,
  reviews,
  subscriptions,
  users,
  views,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value !== undefined) {
      values[field] = value ?? null;
      updateSet[field] = value ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createUserWithPassword(data: {
  openId: string;
  name: string;
  email: string;
  passwordHash: string;
  role?: "user" | "admin";
}): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(users).values({
    openId: data.openId,
    name: data.name,
    email: data.email,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    role: data.role ?? "user",
    lastSignedIn: new Date(),
  });
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(page = 1, limit = 20) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };
  const offset = (page - 1) * limit;
  const result = await db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users);
  return { users: result, total: Number(count) };
}

export async function banUser(id: number, isBanned: boolean) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ isBanned }).where(eq(users.id, id));
}

export async function promoteUser(id: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, id));
}

// ─── Categories ───────────────────────────────────────────────────────────────
export async function getAllCategories(): Promise<Category[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(desc(categories.groupCount));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function createCategory(data: InsertCategory): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(categories).values(data);
}

export async function updateCategoryGroupCount(categoryId: number, delta: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(categories).set({ groupCount: sql`groupCount + ${delta}` }).where(eq(categories.id, categoryId));
}

// ─── Groups ───────────────────────────────────────────────────────────────────
export async function getPublicGroups(opts: {
  categorySlug?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "rank" | "newest" | "clicks";
}) {
  const db = await getDb();
  if (!db) return { groups: [], total: 0 };
  const { categorySlug, search, page = 1, limit = 12, sort = "rank" } = opts;
  const offset = (page - 1) * limit;

  const conditions = [eq(groups.status, "active")];

  if (categorySlug) {
    const cat = await getCategoryBySlug(categorySlug);
    if (cat) conditions.push(eq(groups.categoryId, cat.id));
  }
  if (search) {
    conditions.push(
      or(
        like(groups.name, `%${search}%`),
        like(groups.description, `%${search}%`)
      )!
    );
  }

  const orderBy =
    sort === "newest"
      ? desc(groups.createdAt)
      : sort === "clicks"
      ? desc(groups.totalClicks)
      : desc(groups.rankScore);

  const result = await db
    .select()
    .from(groups)
    .where(and(...conditions))
    .orderBy(desc(groups.isFeatured), orderBy)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(groups)
    .where(and(...conditions));

  return { groups: result, total: Number(count) };
}

export async function getFeaturedGroups(limit = 6): Promise<Group[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(groups)
    .where(and(eq(groups.status, "active"), eq(groups.isFeatured, true)))
    .orderBy(desc(groups.rankScore))
    .limit(limit);
}

export async function getGroupById(id: number): Promise<Group | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
  return result[0];
}

export async function getGroupsByOwner(ownerId: number): Promise<Group[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(groups).where(eq(groups.ownerId, ownerId)).orderBy(desc(groups.createdAt));
}

export async function createGroup(data: InsertGroup): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(groups).values(data);
  return (result[0] as any).insertId;
}

export async function updateGroup(id: number, data: Partial<InsertGroup>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(groups).set(data).where(eq(groups.id, id));
}

export async function updateGroupStatus(id: number, status: Group["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(groups).set({ status }).where(eq(groups.id, id));
}

export async function deleteGroup(id: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(groups).where(eq(groups.id, id));
}

export async function getAllGroupsAdmin(opts: { status?: string; page?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return { groups: [], total: 0 };
  const { status, page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;
  const conditions = status ? [eq(groups.status, status as Group["status"])] : [];

  const result = await db
    .select()
    .from(groups)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(groups.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(groups)
    .where(conditions.length ? and(...conditions) : undefined);

  return { groups: result, total: Number(count) };
}

export async function recalcRankScore(groupId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const group = await getGroupById(groupId);
  if (!group) return;

  const featuredBonus = group.isFeatured ? 100 : 0;
  const pinnedBonus = group.isPinned ? 50 : 0;
  const verifiedBonus = group.isVerified ? 20 : 0;
  const clickScore = group.totalClicks * 1.5;
  const viewScore = group.totalViews * 0.5;
  const score = featuredBonus + pinnedBonus + verifiedBonus + clickScore + viewScore;

  await db.update(groups).set({ rankScore: score }).where(eq(groups.id, groupId));
}

// ─── Clicks & Views ───────────────────────────────────────────────────────────
export async function recordClick(groupId: number, userId?: number, ipHash?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(clicks).values({ groupId, userId, ipHash });
  await db.update(groups).set({
    totalClicks: sql`totalClicks + 1`,
    lastActivityAt: new Date(),
  }).where(eq(groups.id, groupId));
  await recalcRankScore(groupId);
}

export async function recordView(groupId: number, userId?: number, ipHash?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(views).values({ groupId, userId, ipHash });
  await db.update(groups).set({ totalViews: sql`totalViews + 1` }).where(eq(groups.id, groupId));
}

export async function getGroupClicksHistory(groupId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(clicks)
    .where(and(eq(clicks.groupId, groupId), sql`createdAt >= ${since}`))
    .orderBy(desc(clicks.createdAt));
}

export async function updateUserGroupsVerified(userId: number, isVerified: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const userGroups = await getGroupsByOwner(userId);
  await db.update(groups).set({ isVerified }).where(eq(groups.ownerId, userId));
  await Promise.all(userGroups.map(g => recalcRankScore(g.id)));
}

// ─── Subscriptions ────────────────────────────────────────────────────────────
export async function getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  return result[0];
}

export async function upsertSubscription(data: InsertSubscription): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const updateSet: Partial<InsertSubscription> = { ...data };
  delete updateSet.userId;
  await db.insert(subscriptions).values(data).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return result[0];
}

export async function getSubscriptionByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return result[0];
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export async function getGroupReviews(groupId: number): Promise<Review[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviews).where(eq(reviews.groupId, groupId)).orderBy(desc(reviews.createdAt));
}

export async function createReview(data: InsertReview): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(reviews).values(data);
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getUserNotifications(userId: number): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(20);
}

export async function createNotification(data: InsertNotification): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number, userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────
export async function getPlatformStats() {
  const db = await getDb();
  if (!db) return null;

  const [totalUsers] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [totalGroups] = await db.select({ count: sql<number>`count(*)` }).from(groups);
  const [activeGroups] = await db
    .select({ count: sql<number>`count(*)` })
    .from(groups)
    .where(eq(groups.status, "active"));
  const [pendingGroups] = await db
    .select({ count: sql<number>`count(*)` })
    .from(groups)
    .where(eq(groups.status, "pending"));
  const [totalClicks] = await db.select({ count: sql<number>`count(*)` }).from(clicks);
  const [paidSubs] = await db
    .select({ count: sql<number>`count(*)` })
    .from(subscriptions)
    .where(and(eq(subscriptions.status, "active"), sql`plan != 'free'`));

  return {
    totalUsers: Number(totalUsers.count),
    totalGroups: Number(totalGroups.count),
    activeGroups: Number(activeGroups.count),
    pendingGroups: Number(pendingGroups.count),
    totalClicks: Number(totalClicks.count),
    paidSubscriptions: Number(paidSubs.count),
  };
}

// ─── Plan limits ─────────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free:    { maxGroups: 1    as number | null, maxFeatured: 0, analytics: "none"  as "none" | "basic" | "full" },
  starter: { maxGroups: 3    as number | null, maxFeatured: 0, analytics: "basic" as "none" | "basic" | "full" },
  pro:     { maxGroups: 5    as number | null, maxFeatured: 1, analytics: "full"  as "none" | "basic" | "full" },
  premium: { maxGroups: null as number | null, maxFeatured: 3, analytics: "full"  as "none" | "basic" | "full" },
};

export type PlanType = keyof typeof PLAN_LIMITS;
