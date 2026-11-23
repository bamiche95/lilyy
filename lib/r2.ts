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

function imageKey(
  folder: string,
  fallback: string,
  slug: string,
  contentType: string,
  nonce: number,
): string {
  const year = new Date().getFullYear();
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || fallback;
  return `${folder}/${year}/${safeSlug}-${nonce.toString(36)}.${extensionFor(contentType)}`;
}

/** `products/2026/surdeigsbrod-m1x2n3.jpg` */
export function productImageKey(slug: string, contentType: string, nonce = Date.now()): string {
  return imageKey("products", "product", slug, contentType, nonce);
}

/** `categories/2026/pies-m1x2n3.jpg` */
export function categoryImageKey(slug: string, contentType: string, nonce = Date.now()): string {
  return imageKey("categories", "category", slug, contentType, nonce);
}

/** `content/2026/heroimageprimary-m1x2n3.jpg` */
export function contentImageKey(slug: string, contentType: string, nonce = Date.now()): string {
  return imageKey("content", "content", slug, contentType, nonce);
}

/**
 * Inverse of `publicObjectUrl`, used when a replaced photo should be removed
 * from the bucket. Returns null for anything we did not upload ourselves, so a
 * URL pasted into the admin form can never delete someone else's asset.
 */
export function keyFromPublicUrl(url: string): string | null {
  if (!isR2Configured()) return null;

  const base = serverEnv().R2_PUBLIC_URL.replace(/\/+$/, "");

  if (!url.startsWith(`${base}/`)) return null;

  const key = url.slice(base.length + 1).split(/[?#]/)[0];
  return key.length > 0 ? key : null;
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
