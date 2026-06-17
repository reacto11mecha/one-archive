import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { s3Client } from "~/server/storage";
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";
import { randomUUID } from "crypto";
import * as schema from "~/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

type FileTypeEnum = "PDF" | "Word" | "Excel" | "Gambar" | "Lainnya";

function getFileTypeSafe(mimeType: string, fileName: string): FileTypeEnum {
  // 1. Cek dari MIME Type terlebih dahulu
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Gambar";
  if (mimeType.includes("word") || mimeType === "application/msword")
    return "Word";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "Excel";

  // 2. Fallback menggunakan Switch Statement berdasarkan ekstensi
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "PDF";
    case "doc":
    case "docx":
      return "Word";
    case "xls":
    case "xlsx":
      return "Excel";
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
      return "Gambar";
    default:
      return "Lainnya";
  }
}

export const archiveRouter = createTRPCRouter({
  // 1. Fungsi bawaan Anda: Meminta URL upload dari S3 (SeaweedFS)
  getUploadUrl: protectedProcedure
    .input(z.object({ fileName: z.string(), fileType: z.string() }))
    .mutation(async ({ input }) => {
      const fileKey = `archives/${randomUUID()}-${input.fileName}`;

      const command = new PutObjectCommand({
        Bucket: env.STORAGE_BUCKET_NAME,
        Key: fileKey,
        ContentType: input.fileType,
      });

      // URL ini berlaku selama 60 detik untuk upload ke S3
      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60,
      });

      return { uploadUrl, fileKey };
    }),

  // 2. Fungsi BARU: Mengambil daftar Klasifikasi Arsip sesuai Hak Akses (RBAC)
  getAllowedClassifications: protectedProcedure.query(async ({ ctx }) => {
    // Ambil profil pengguna saat ini beserta rolenya
    const userCheck = await ctx.db.query.user.findFirst({
      where: eq(schema.user.id, ctx.session.user.id),
      with: { role: true },
    });

    const isAdmin = userCheck?.role?.isAdmin ?? false;
    const roleId = userCheck?.roleId;

    let allowedCategoryIds: string[] = [];

    if (isAdmin) {
      // Jika Admin Utama, ambil SEMUA ID Kategori tanpa terkecuali
      const allCats = await ctx.db.query.categories.findMany();
      allowedCategoryIds = allCats.map((c) => c.id);
    } else if (roleId) {
      // Jika staf/guru biasa, cari izinnya di tabel pivot 'roleCategoryAccess'
      const access = await ctx.db.query.roleCategoryAccess.findMany({
        where: eq(schema.roleCategoryAccess.roleId, roleId),
      });
      allowedCategoryIds = access.map((a) => a.categoryId);
    }

    // Jika tidak punya akses ke kategori apa pun
    if (allowedCategoryIds.length === 0) {
      return { categories: [], subcategories: [], documentTypes: [] };
    }

    // Tarik data Kategori yang HANYA diizinkan
    const categories = await ctx.db.query.categories.findMany({
      where: inArray(schema.categories.id, allowedCategoryIds),
    });

    // Tarik Sub-Kategori yang HANYA berinduk pada Kategori yang diizinkan
    const subcategories = await ctx.db.query.subcategories.findMany({
      where: inArray(schema.subcategories.categoryId, allowedCategoryIds),
    });

    // Tarik Jenis Surat yang HANYA berinduk pada Sub-Kategori di atas
    const subCatIds = subcategories.map((s) => s.id);
    const documentTypes =
      subCatIds.length > 0
        ? await ctx.db.query.documentTypes.findMany({
            where: inArray(schema.documentTypes.subcategoryId, subCatIds),
          })
        : [];

    return { categories, subcategories, documentTypes };
  }),

  getArchives: protectedProcedure.query(async ({ ctx }) => {
    const userCheck = await ctx.db.query.user.findFirst({
      where: eq(schema.user.id, ctx.session.user.id),
      with: { role: true },
    });

    const isAdmin = userCheck?.role?.isAdmin ?? false;
    const roleId = userCheck?.roleId;

    let archivesList: any[] = [];

    if (isAdmin) {
      archivesList = await ctx.db.query.archives.findMany({
        orderBy: (archives, { desc }) => [desc(archives.createdAt)],
      });
    } else if (roleId) {
      const access = await ctx.db.query.roleCategoryAccess.findMany({
        where: eq(schema.roleCategoryAccess.roleId, roleId),
      });
      const allowedCategoryIds = access.map((a) => a.categoryId);

      if (allowedCategoryIds.length > 0) {
        archivesList = await ctx.db.query.archives.findMany({
          where: inArray(schema.archives.categoryId, allowedCategoryIds),
          orderBy: (archives, { desc }) => [desc(archives.createdAt)],
        });
      } else {
        archivesList = [];
      }
    }

    // --- Kode uploaderName di bawah ini dibiarkan sama seperti aslinya ---
    const uploaderIds = [
      ...new Set(archivesList.map((a) => a.uploaderId)),
    ].filter(Boolean) as string[];
    let uploaders: { id: string; name: string | null }[] = [];

    if (uploaderIds.length > 0) {
      uploaders = await ctx.db.query.user.findMany({
        where: inArray(schema.user.id, uploaderIds),
        columns: { id: true, name: true },
      });
    }

    return archivesList.map((arc) => ({
      ...arc,
      uploaderName:
        uploaders.find((u) => u.id === arc.uploaderId)?.name ?? "Anonim",
    }));
  }),

  getFileAccessUrl: protectedProcedure
    .input(
      z.object({
        fileKey: z.string(),
        originalName: z.string(),
        action: z.enum(["view", "download"]),
      }),
    )
    .mutation(async ({ input }) => {
      const command = new GetObjectCommand({
        Bucket: env.STORAGE_BUCKET_NAME,
        Key: input.fileKey,
        // Jika minta didownload, paksa browser untuk mengunduhnya dengan nama asli file
        ResponseContentDisposition:
          input.action === "download"
            ? `attachment; filename="${input.originalName}"`
            : "inline",
      });

      // Hasilkan URL yang valid selama 5 menit saja demi keamanan
      const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
      return url;
    }),

  createArchive: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        categoryId: z.string(),
        subcategoryId: z.string(),
        documentTypeId: z.string(),
        fileKey: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        description: z.string().optional(),
        nomorSurat: z.string().optional(), // 👈 Diperbaiki dari documentNumber
        createdAt: z.date().optional(),
        retentionDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = await ctx.db.query.user.findFirst({
        where: eq(schema.user.id, ctx.session.user.id),
      });
      if (!currentUser?.roleId)
        throw new TRPCError({ code: "FORBIDDEN", message: "Akses ditolak" });
      const exactFileType = getFileTypeSafe(input.mimeType, input.originalName);

      return await ctx.db.insert(schema.archives).values({
        id: randomUUID(),
        title: input.title,
        fileType: exactFileType,
        fileKey: input.fileKey,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        documentTypeId: input.documentTypeId,
        description: input.description,
        nomorSurat: input.nomorSurat, // 👈 Diperbaiki
        createdAt: input.createdAt ?? new Date(),
        retentionDate: input.retentionDate,
        uploaderId: ctx.session.user.id,
        unitPengolahId: currentUser.roleId,
      });
    }),

  // 👇 FITUR EDIT DIPERBAIKI
  updateArchive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string().optional(),
        nomorSurat: z.string().optional(), // 👈 Diperbaiki
        createdAt: z.date().optional(),
        retentionDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(schema.archives)
        .set({
          title: input.title,
          description: input.description,
          nomorSurat: input.nomorSurat, // 👈 Diperbaiki
          createdAt: input.createdAt,
          retentionDate: input.retentionDate,
        })
        .where(eq(schema.archives.id, input.id));
    }),

  // 👇 ENDPOINT BARU: Hapus Arsip & Fisik File di S3
  deleteArchive: protectedProcedure
    .input(z.object({ id: z.string(), fileKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Hapus berkas fisik dari S3 agar penyimpanan tidak bengkak
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.STORAGE_BUCKET_NAME,
            Key: input.fileKey,
          }),
        );
      } catch (error) {
        console.error("Peringatan: Gagal menghapus berkas S3", error);
        // Kita tidak melempar error agar data DB tetap bisa dihapus meski S3 bermasalah
      }

      // 2. Hapus data dari Database
      return await ctx.db
        .delete(schema.archives)
        .where(eq(schema.archives.id, input.id));
    }),
});
