import { pgTable, uuid, text, timestamp, unique, primaryKey, pgEnum, integer, jsonb, index, varchar, boolean } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums
export const userRolesEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "staff_admin",
  "staff_manager",
  "consumer",
]);

export const itemTypeEnum = pgEnum("item_type", [
  "video",
  "pdf",
  "article",
  "embed",
  "link",
]);

export const analyticsEventTypeEnum = pgEnum("analytics_event_type", [
  "view",
  "complete",
]);

export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "attending",
  "not_attending",
  "maybe", // Added for completeness, as rsvp statuses often have a "maybe"
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

// Tables
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  stripeCustomerId: text("stripe_customer_id"), // For the Org paying the Platform
  stripeAccountId: text("stripe_account_id"), // For the Org receiving payments (Connect)
  stripeAccountEnabled: boolean("stripe_account_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  role: userRolesEnum("role").notNull(),
}, (t) => ({
  unq: unique().on(t.userId, t.organizationId),
}));

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdById: uuid("created_by").references(() => users.id, { onDelete: "set null" }), // if user is deleted, keep collection but set created_by to null
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  collectionId: uuid("collection_id").references(() => collections.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: itemTypeEnum("type").notNull(),
  contentUrl: text("content_url"), // For video, pdf, embed, link
  articleContent: jsonb("article_content"), // For article (JSON from TipTap)
  thumbnailUrl: text("thumbnail_url"),
  isFavorite: boolean("is_favorite").default(false), // NEW FIELD for favorites
  orderIndex: integer("order_index").default(0), // NEW FIELD for ordering
  createdById: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


export const tags = pgTable("tags", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
}, (t) => ({
  unq: unique().on(t.organizationId, t.name),
}));

export const itemTags = pgTable("item_tags", {
  itemId: uuid("item_id").references(() => items.id, { onDelete: "cascade" }).notNull(),
  tagId: uuid("tag_id").references(() => tags.id, { onDelete: "cascade" }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.itemId, t.tagId] }),
}));

export const invites = pgTable("invites", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  code: text("code").unique().notNull(),
  createdById: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  referrerUserId: uuid("referrer_user_id").references(() => users.id, { onDelete: "set null" }),
  referredUserId: uuid("referred_user_id").references(() => users.id, { onDelete: "set null" }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  itemId: uuid("item_id").references(() => items.id, { onDelete: "set null" }),
  eventType: analyticsEventTypeEnum("event_type").notNull(),
  durationSeconds: integer("duration_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organization's subscription to the Platform
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
  status: text("status").notNull(), // active, past_due, canceled, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Consumer's subscription to an Organization
export const consumerSubscriptions = pgTable("consumer_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
  status: text("status").notNull(), // active, past_due, canceled
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Products (e.g., "Monthly Membership") created by Organizations
export const products = pgTable("products", {
  id: text("id").primaryKey(), // Stripe Product ID (prod_...)
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Prices for Products
export const prices = pgTable("prices", {
  id: text("id").primaryKey(), // Stripe Price ID (price_...)
  productId: text("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
  currency: text("currency").notNull(), // usd
  unitAmount: integer("unit_amount").notNull(), // in cents
  interval: text("interval").notNull(), // month, year
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Placeholder tables for future expansion
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  zoomLink: text("zoom_link"),
  createdById: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rsvps = pgTable("rsvps", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status: rsvpStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  unq: unique().on(t.eventId, t.userId),
}));

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  status: bookingStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations (for easier querying with Drizzle)
export const usersRelations = relations(users, ({ many }) => ({
  organizations: many(organizations),
  memberships: many(memberships),
  collections: many(collections),
  items: many(items),
  invites: many(invites),
  referralsMade: many(referrals, { relationName: "referrer" }),
  referralsReceived: many(referrals, { relationName: "referred" }),
  analyticsEvents: many(analyticsEvents),
  rsvps: many(rsvps),
  bookings: many(bookings),
  consumerSubscriptions: many(consumerSubscriptions),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerUserId],
    references: [users.id],
  }),
  memberships: many(memberships),
  collections: many(collections),
  items: many(items),
  tags: many(tags),
  invites: many(invites),
  referrals: many(referrals),
  analyticsEvents: many(analyticsEvents),
  subscriptions: many(subscriptions), // Platform subscriptions
  consumerSubscriptions: many(consumerSubscriptions), // Consumer subscriptions to this Org
  products: many(products),
  events: many(events),
  bookings: many(bookings),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [memberships.organizationId],
    references: [organizations.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [collections.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [collections.createdById],
    references: [users.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [items.organizationId],
    references: [organizations.id],
  }),
  collection: one(collections, {
    fields: [items.collectionId],
    references: [collections.id],
  }),
  creator: one(users, {
    fields: [items.createdById],
    references: [users.id],
  }),
  itemTags: many(itemTags),
  analyticsEvents: many(analyticsEvents),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tags.organizationId],
    references: [organizations.id],
  }),
  itemTags: many(itemTags),
}));

export const itemTagsRelations = relations(itemTags, ({ one }) => ({
  item: one(items, {
    fields: [itemTags.itemId],
    references: [items.id],
  }),
  tag: one(tags, {
    fields: [itemTags.tagId],
    references: [tags.id],
  }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  organization: one(organizations, {
    fields: [invites.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [invites.createdById],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  organization: one(organizations, {
    fields: [referrals.organizationId],
    references: [organizations.id],
  }),
  referrer: one(users, {
    fields: [referrals.referrerUserId],
    references: [users.id],
    relationName: "referrer",
  }),
  referred: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
    relationName: "referred",
  }),
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [analyticsEvents.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id],
  }),
  item: one(items, {
    fields: [analyticsEvents.itemId],
    references: [items.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
}));

export const consumerSubscriptionsRelations = relations(consumerSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [consumerSubscriptions.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [consumerSubscriptions.organizationId],
    references: [organizations.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  prices: many(prices),
}));

export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [events.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  rsvps: many(rsvps),
}));

export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  event: one(events, {
    fields: [rsvps.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [rsvps.userId],
    references: [users.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  organization: one(organizations, {
    fields: [bookings.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
}));