import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `one_archive_${name}`);

// ==========================================
// 1. ENUMS (Tipe Data Kustom)
// ==========================================
export const fileTypeEnum = pgEnum("file_type", [
  "PDF",
  "Word",
  "Excel",
  "Gambar",
  "Lainnya",
]);
export const retentionStatusEnum = pgEnum("retention_status", [
  "Aktif",
  "Inaktif",
  "Dimusnahkan",
  "Permanen",
]);

export const archiveTypeEnum = pgEnum("archive_type", ["Masuk", "Keluar"]);

// ==========================================
// 2. TABEL OTENTIKASI & PENGGUNA
// ==========================================
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  roleId: text("role_id").references(() => roles.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
});

// ==========================================
// 3. TABEL MANAJEMEN ARSIP (2-TINGKAT)
// ==========================================
export const roles = createTable("role", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const categories = createTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  colorBadge: text("color_badge"),
});

export const roleCategoryAccess = createTable(
  "role_category_access",
  {
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.categoryId] })],
);

export const subcategories = createTable("subcategory", {
  id: text("id").primaryKey(),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

// ❌ TABEL documentTypes TELAH DIHAPUS SEPENUHNYA DI SINI

export const archives = createTable("archive", {
  id: text("id").primaryKey(),
  nomorSurat: text("nomor_surat"),
  title: text("title").notNull(),
  description: text("description"),
  fileType: fileTypeEnum("file_type").notNull(),

  // 👇 KOLOM BARU SEBAGAI PENGGANTI SUB-JENIS (MASUK / KELUAR)
  archiveType: archiveTypeEnum("archive_type").notNull(),

  fileKey: text("file_key").notNull(),
  isShared: boolean("is_shared").default(false).notNull(),

  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  subcategoryId: text("subcategory_id")
    .notNull()
    .references(() => subcategories.id),
  // ❌ KOLOM documentTypeId TELAH DIHAPUS

  retentionDate: timestamp("retention_date", { withTimezone: true }),
  retentionStatus: retentionStatusEnum("retention_status")
    .default("Aktif")
    .notNull(),

  uploaderId: text("uploader_id")
    .notNull()
    .references(() => user.id),
  unitPengolahId: text("unit_pengolah_id")
    .notNull()
    .references(() => roles.id),

  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

export const archiveShares = createTable("archive_share", {
  id: text("id").primaryKey(),
  archiveId: text("archive_id")
    .notNull()
    .unique()
    .references(() => archives.id, { onDelete: "cascade" }),
  plainKey: text("plain_key").notNull(),
  hashedKey: text("hashed_key").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date())
    .notNull(),
});

// ==========================================
// 4. DEFINISI RELASI DATA
// ==========================================
export const userRelations = relations(user, ({ one, many }) => ({
  account: many(account),
  session: many(session),
  role: one(roles, { fields: [user.roleId], references: [roles.id] }),
  uploadedArchives: many(archives, { relationName: "uploader" }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(user),
  categoryAccess: many(roleCategoryAccess),
  archives: many(archives, { relationName: "unitPengolah" }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  roleAccess: many(roleCategoryAccess),
  subcategories: many(subcategories),
  archives: many(archives),
}));

export const roleCategoryAccessRelations = relations(
  roleCategoryAccess,
  ({ one }) => ({
    role: one(roles, {
      fields: [roleCategoryAccess.roleId],
      references: [roles.id],
    }),
    category: one(categories, {
      fields: [roleCategoryAccess.categoryId],
      references: [categories.id],
    }),
  }),
);

export const subcategoriesRelations = relations(
  subcategories,
  ({ one, many }) => ({
    category: one(categories, {
      fields: [subcategories.categoryId],
      references: [categories.id],
    }),
    archives: many(archives),
  }),
);

// ❌ RELASI documentTypesRelations TELAH DIHAPUS

export const archivesRelations = relations(archives, ({ one }) => ({
  category: one(categories, {
    fields: [archives.categoryId],
    references: [categories.id],
  }),
  subcategory: one(subcategories, {
    fields: [archives.subcategoryId],
    references: [subcategories.id],
  }),
  // ❌ FIELD RELASI documentType DIHAPUS
  uploader: one(user, {
    fields: [archives.uploaderId],
    references: [user.id],
    relationName: "uploader",
  }),
  unitPengolah: one(roles, {
    fields: [archives.unitPengolahId],
    references: [roles.id],
    relationName: "unitPengolah",
  }),
  shareConfig: one(archiveShares, {
    fields: [archives.id],
    references: [archiveShares.archiveId],
  }),
}));

export const archiveSharesRelations = relations(archiveShares, ({ one }) => ({
  archive: one(archives, {
    fields: [archiveShares.archiveId],
    references: [archives.id],
  }),
}));
