import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "~/server/api/trpc";
import * as schema from "~/server/db/schema";
import { eq, not, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { auth } from "~/server/better-auth/config";

export const systemRouter = createTRPCRouter({
  getUsers: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.user.findMany({
      with: { role: true },
      where: not(eq(schema.user.id, ctx.session.user.id)),
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });
  }),

  getRoles: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.roles.findMany();
  }),

  updateUserRole: adminProcedure
    .input(z.object({ userId: z.string(), roleId: z.string().nullable() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(schema.user)
        .set({ roleId: input.roleId })
        .where(eq(schema.user.id, input.userId));
    }),

  createUser: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Nama wajib diisi"),
        email: z.string().email("Format email tidak valid"),
        password: z.string().min(8, "Kata sandi minimal 8 karakter"),
        roleId: z.string().min(1, "Jabatan wajib dipilih"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Cek apakah email sudah dipakai
      const existingUser = await ctx.db.query.user.findFirst({
        where: eq(schema.user.email, input.email),
      });

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email sudah terdaftar!",
        });
      }

      // Buat akun via Better-Auth agar password di-hash secara otomatis
      const res = await auth.api.signUpEmail({
        body: {
          email: input.email,
          password: input.password,
          name: input.name,
        },
      });

      if (!res?.user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat pengguna.",
        });
      }

      await ctx.db
        .update(schema.user)
        .set({ roleId: input.roleId })
        .where(eq(schema.user.id, res.user.id));

      return { success: true };
    }),

  deleteUser: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Anda tidak dapat menghapus akun Anda sendiri.",
        });
      }

      return await ctx.db
        .delete(schema.user)
        .where(eq(schema.user.id, input.userId));
    }),

  getCategories: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.categories.findMany();
  }),

  getRolesWithAccess: adminProcedure.query(async ({ ctx }) => {
    const rolesData = await ctx.db.query.roles.findMany();
    const accessData = await ctx.db.query.roleCategoryAccess.findMany();

    return rolesData.map((role) => ({
      ...role,
      categoryIds: accessData
        .filter((a) => a.roleId === role.id)
        .map((a) => a.categoryId),
    }));
  }),

  upsertRole: adminProcedure
    .input(
      z.object({
        id: z.string().min(1, "ID Peran wajib diisi"), // cth: role_keuangan
        name: z.string().min(1, "Nama Peran wajib diisi"),
        isAdmin: z.boolean(),
        categoryIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Upsert data utama role
      await ctx.db
        .insert(schema.roles)
        .values({ id: input.id, name: input.name, isAdmin: input.isAdmin })
        .onConflictDoUpdate({
          target: schema.roles.id,
          set: { name: input.name, isAdmin: input.isAdmin },
        });

      // Bersihkan hak akses lama untuk role ini agar tidak duplikat
      await ctx.db
        .delete(schema.roleCategoryAccess)
        .where(eq(schema.roleCategoryAccess.roleId, input.id));

      // Masukkan matriks hak akses yang baru dicentang
      if (input.categoryIds.length > 0) {
        const accessToInsert = input.categoryIds.map((catId) => ({
          roleId: input.id,
          categoryId: catId,
        }));
        await ctx.db.insert(schema.roleCategoryAccess).values(accessToInsert);
      }

      return { success: true };
    }),

  deleteRole: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Proteksi agar Admin Utama tidak bisa dihapus hingga sistem lumpuh
      if (input.id === "role_admin") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Peran Administrator Utama tidak boleh dihapus.",
        });
      }

      return await ctx.db
        .delete(schema.roles)
        .where(eq(schema.roles.id, input.id));
    }),

  // 10. Ambil seluruh data Kategori, Sub-Kategori, dan Jenis Dokumen secara terpisah untuk digabungkan di frontend
  getClassificationData: adminProcedure.query(async ({ ctx }) => {
    const allCategories = await ctx.db.query.categories.findMany();
    const allSubcategories = await ctx.db.query.subcategories.findMany();
    const allDocumentTypes = await ctx.db.query.documentTypes.findMany();

    return {
      categories: allCategories,
      subcategories: allSubcategories,
      documentTypes: allDocumentTypes,
    };
  }),

  // 11. Tambah Kategori Utama
  createCategory: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1, "Nama kategori wajib diisi"),
        icon: z.string().default("📁"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(schema.categories).values({
        id: input.id,
        name: input.name,
        icon: input.icon,
        colorBadge: "badge-blue",
      });
    }),

  // 12. Tambah Sub-Kategori
  createSubcategory: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        categoryId: z.string().min(1),
        name: z.string().min(1, "Nama sub-kategori wajib diisi"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(schema.subcategories).values(input);
    }),

  // 13. Tambah Jenis Surat / Dokumen
  createDocumentType: adminProcedure
    .input(
      z.object({
        id: z.string().min(1),
        subcategoryId: z.string().min(1),
        name: z.string().min(1, "Nama jenis surat wajib diisi"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(schema.documentTypes).values(input);
    }),

  // 14. Hapus Komponen Klasifikasi (Kategori / Sub / Jenis)
  deleteClassificationItem: adminProcedure
    .input(
      z.object({
        type: z.enum(["category", "subcategory", "documentType"]),
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.type === "category") {
        await ctx.db
          .delete(schema.categories)
          .where(eq(schema.categories.id, input.id));
      } else if (input.type === "subcategory") {
        await ctx.db
          .delete(schema.subcategories)
          .where(eq(schema.subcategories.id, input.id));
      } else {
        await ctx.db
          .delete(schema.documentTypes)
          .where(eq(schema.documentTypes.id, input.id));
      }
      return { success: true };
    }),
});
