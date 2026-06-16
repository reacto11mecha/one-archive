import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { s3Client } from "~/server/storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";
import { randomUUID } from "crypto";

export const archiveRouter = createTRPCRouter({
  // Fungsi untuk meminta URL upload dari S3
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
});
