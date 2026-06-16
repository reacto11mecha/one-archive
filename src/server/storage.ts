import { S3Client } from "@aws-sdk/client-s3";
import { env } from "~/env";

// Pola cache untuk S3 Client
const globalForS3 = globalThis as unknown as {
  s3: S3Client | undefined;
};

export const s3Client =
  globalForS3.s3 ??
  new S3Client({
    endpoint: env.STORAGE_ENDPOINT,
    region: env.STORAGE_REGION,
    credentials: {
      accessKeyId: env.STORAGE_ACCESS_KEY,
      secretAccessKey: env.STORAGE_SECRET_KEY,
    },
    forcePathStyle: true,
  });

if (env.NODE_ENV !== "production") globalForS3.s3 = s3Client;
