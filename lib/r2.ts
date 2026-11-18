import "server-only";

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { serverEnv } from "./env";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

let client: S3Client | null = null;

function r2(): S3Client {
  if (client) return client;

  const env = serverEnv();

  client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  return client;
}

/** Public CDN URL for an object key. */
export function publicObjectUrl(key: string): string {
  const base = serverEnv().R2_PUBLIC_URL.replace(/\/+$/, "");
  return `${base}/${key.replace(/^\/+/, "")}`;
}

export function isAllowedImageType(contentType: string): boolean {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(contentType);
}

/**
 * True when real R2 credentials are present. Placeholder values from
 * `.env.example` are rejected so the admin UI can fall back to image URLs
 * instead of throwing a 500 on first upload.
 */
export function isR2Configured(): boolean {
  const values = [
    process.env.R2_ACCOUNT_ID,
    process.env.R2_ACCESS_KEY_ID,
    process.env.R2_SECRET_ACCESS_KEY,
    process.env.R2_BUCKET_NAME,
    process.env.R2_PUBLIC_URL,
  ];

  return values.every(
    (value) =>
      typeof value === "string" &&
      value.trim().length > 0 &&
      !/placeholder|your[-_ ]|changeme|xxxx|example\.com/i.test(value),
  );
}

function extensionFor(contentType: string, fallback = "jpg"): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "image/jpeg":
      return "jpg";
    default:
      return fallback;
  }
}

/** `products/2026/surdeigsbrod-m1x2n3.jpg` */
export function productImageKey(slug: string, contentType: string, nonce = Date.now()): string {
  const year = new Date().getFullYear();
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "product";
  return `products/${year}/${safeSlug}-${nonce.toString(36)}.${extensionFor(contentType)}`;
}

/** Browser uploads directly to R2 with this short-lived PUT URL. */
export async function createUploadUrl(options: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: serverEnv().R2_BUCKET_NAME,
    Key: options.key,
    ContentType: options.contentType,
  });

  return getSignedUrl(r2(), command, { expiresIn: options.expiresIn ?? 300 });
}

/** Server-side upload (seeds, generated PDFs). */
export async function uploadObject(options: {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType: string;
  cacheControl?: string;
}): Promise<string> {
  await r2().send(
    new PutObjectCommand({
      Bucket: serverEnv().R2_BUCKET_NAME,
      Key: options.key,
      Body: options.body,
      ContentType: options.contentType,
      CacheControl: options.cacheControl ?? "public, max-age=31536000, immutable",
    }),
  );

  return publicObjectUrl(options.key);
}

export async function deleteObject(key: string): Promise<void> {
  await r2().send(
    new DeleteObjectCommand({
      Bucket: serverEnv().R2_BUCKET_NAME,
      Key: key,
    }),
  );
}
