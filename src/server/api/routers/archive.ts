import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
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
import bcrypt from "bcryptjs";

type FileTypeEnum = "PDF" | "Word" | "Excel" | "Gambar" | "Lainnya";

function getFileTypeSafe(mimeType: string, fileName: string): FileTypeEnum {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.startsWith("image/")) return "Gambar";
  if (mimeType.includes("word") || mimeType === "application/msword")
    return "Word";
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return "Excel";

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
  getUploadUrl: protectedProcedure
    .input(z.object({ fileName: z.string(), fileType: z.string() }))
    .mutation(async ({ input }) => {
      const fileKey = `archives/${randomUUID()}-${input.fileName}`;
      const command = new PutObjectCommand({
        Bucket: env.STORAGE_BUCKET_NAME,
        Key: fileKey,
        ContentType: input.fileType,
      });
      const uploadUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60,
      });
      return { uploadUrl, fileKey };
    }),

  getAllowedClassifications: protectedProcedure.query(async ({ ctx }) => {
    const userCheck = await ctx.db.query.user.findFirst({
      where: eq(schema.user.id, ctx.session.user.id),
      with: { role: true },
    });
    const isAdmin = userCheck?.role?.isAdmin ?? false;
    const roleId = userCheck?.roleId;

    let allowedCategoryIds: string[] = [];
    if (isAdmin) {
      const allCats = await ctx.db.query.categories.findMany();
      allowedCategoryIds = allCats.map((c) => c.id);
    } else if (roleId) {
      const access = await ctx.db.query.roleCategoryAccess.findMany({
        where: eq(schema.roleCategoryAccess.roleId, roleId),
      });
      allowedCategoryIds = access.map((a) => a.categoryId);
    }

    if (allowedCategoryIds.length === 0) {
      return { categories: [], subcategories: [] };
    }

    const categories = await ctx.db.query.categories.findMany({
      where: inArray(schema.categories.id, allowedCategoryIds),
    });
    const subcategories = await ctx.db.query.subcategories.findMany({
      where: inArray(schema.subcategories.categoryId, allowedCategoryIds),
    });

    return { categories, subcategories };
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
        with: { shareConfig: true },
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
          with: { shareConfig: true },
        });
      } else {
        archivesList = [];
      }
    }

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
        ResponseContentDisposition:
          input.action === "download"
            ? `attachment; filename="${input.originalName}"`
            : "inline",
      });
      return await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 });
    }),

  createArchive: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        categoryId: z.string(),
        subcategoryId: z.string(),
        archiveType: z.enum(["Masuk", "Keluar"]),
        fileKey: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        description: z.string().optional(),
        nomorSurat: z.string().optional(),
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
        archiveType: input.archiveType,
        fileKey: input.fileKey,
        categoryId: input.categoryId,
        subcategoryId: input.subcategoryId,
        description: input.description,
        nomorSurat: input.nomorSurat,
        createdAt: input.createdAt ?? new Date(),
        retentionDate: input.retentionDate,
        uploaderId: ctx.session.user.id,
        unitPengolahId: currentUser.roleId,
      });
    }),

  updateArchive: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string(),
        archiveType: z.enum(["Masuk", "Keluar"]).optional(),
        description: z.string().optional(),
        nomorSurat: z.string().optional(),
        createdAt: z.date().optional(),
        retentionDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(schema.archives)
        .set({
          title: input.title,
          archiveType: input.archiveType,
          description: input.description,
          nomorSurat: input.nomorSurat,
          createdAt: input.createdAt,
          retentionDate: input.retentionDate,
        })
        .where(eq(schema.archives.id, input.id));
    }),

  deleteArchive: protectedProcedure
    .input(z.object({ id: z.string(), fileKey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: env.STORAGE_BUCKET_NAME,
            Key: input.fileKey,
          }),
        );
      } catch (error) {
        console.error("Peringatan: Gagal menghapus berkas S3", error);
      }
      return await ctx.db
        .delete(schema.archives)
        .where(eq(schema.archives.id, input.id));
    }),

  shareArchive: protectedProcedure
    .input(
      z.object({
        archiveId: z.string(),
        passkey: z.string().min(4, "Passkey minimal harus 4 karakter"),
      }),
    )
    .mutation(({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        const saltRound = 10;
        const hashedPassword = await bcrypt.hash(input.passkey, saltRound);

        await tx
          .insert(schema.archiveShares)
          .values({
            id: randomUUID(),
            archiveId: input.archiveId,
            plainKey: input.passkey,
            hashedKey: hashedPassword,
          })
          .onConflictDoUpdate({
            target: schema.archiveShares.archiveId,
            set: {
              plainKey: input.passkey,
              hashedKey: hashedPassword,
              updatedAt: new Date(),
            },
          });

        await tx
          .update(schema.archives)
          .set({ isShared: true })
          .where(eq(schema.archives.id, input.archiveId));

        return { success: true };
      }),
    ),

  unshareArchive: protectedProcedure
    .input(z.object({ archiveId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.transaction(async (tx) => {
        await ctx.db
          .update(schema.archives)
          .set({ isShared: false })
          .where(eq(schema.archives.id, input.archiveId));

        await ctx.db
          .delete(schema.archiveShares)
          .where(eq(schema.archiveShares.archiveId, input.archiveId));

        return { success: true };
      }),
    ),

  checkShareStatus: publicProcedure
    .input(z.object({ archiveId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Hanya tarik kolom isShared saja agar ringan dan aman
      const archive = await ctx.db.query.archives.findFirst({
        where: eq(schema.archives.id, input.archiveId),
        columns: { isShared: true },
      });

      // Jika arsip tidak ada di database ATAU isShared sudah dimatikan
      if (!archive || !archive.isShared) {
        return { isValid: false };
      }

      return { isValid: true };
    }),

  verifySharePasskey: publicProcedure
    .input(z.object({ archiveId: z.string(), passkey: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const archive = await ctx.db.query.archives.findFirst({
        where: eq(schema.archives.id, input.archiveId),
        with: {
          shareConfig: true,
          category: true,
          subcategory: true,
        },
      });

      if (!archive || !archive.isShared || !archive.shareConfig) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message:
            "Arsip tidak ditemukan atau tautan publik telah dinonaktifkan oleh Administrator.",
        });
      }

      const isValid = await bcrypt.compare(
        input.passkey,
        archive.shareConfig.hashedKey,
      );
      if (!isValid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Passkey tidak valid. Akses ditolak.",
        });
      }

      const actualExt = archive.fileKey.split(".").pop() || "pdf";
      const cleanFileName = `${archive.title}.${actualExt}`;

      const viewCommand = new GetObjectCommand({
        Bucket: env.STORAGE_BUCKET_NAME,
        Key: archive.fileKey,
        ResponseContentDisposition: "inline",
      });
      const viewUrl = await getSignedUrl(s3Client, viewCommand, {
        expiresIn: 60 * 15,
      });

      const dlCommand = new GetObjectCommand({
        Bucket: env.STORAGE_BUCKET_NAME,
        Key: archive.fileKey,
        ResponseContentDisposition: `attachment; filename="${cleanFileName}"`,
      });
      const downloadUrl = await getSignedUrl(s3Client, dlCommand, {
        expiresIn: 60 * 15,
      });

      return {
        id: archive.id,
        title: archive.title,
        nomorSurat: archive.nomorSurat,
        description: archive.description,
        createdAt: archive.createdAt,
        categoryName: archive.category?.name,
        subcategoryName: archive.subcategory?.name,
        fileType: archive.fileType,
        viewUrl,
        downloadUrl,
      };
    }),

  destroyArchive: protectedProcedure
    .input(z.object({ archiveId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const archive = await ctx.db.query.archives.findFirst({
        where: eq(schema.archives.id, input.archiveId),
      });

      if (!archive) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Arsip tidak ditemukan",
        });
      }

      if (archive.fileKey !== "DESTROYED") {
        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: env.STORAGE_BUCKET_NAME,
              Key: archive.fileKey,
            }),
          );
        } catch (error) {
          console.error("Gagal menghapus file fisik di S3:", error);
        }
      }

      await ctx.db
        .update(schema.archives)
        .set({
          retentionStatus: "Dimusnahkan",
          fileKey: "DESTROYED",
          updatedAt: new Date(),
        })
        .where(eq(schema.archives.id, input.archiveId));

      return { success: true };
    }),
});
