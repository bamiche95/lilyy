import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  createUploadUrl,
  isR2Configured,
  productImageKey,
  publicObjectUrl,
} from "@/lib/r2";
import { getSession, isAdmin } from "@/lib/session";

const requestSchema = z.object({
  /**
   * Optional: `/admin/products/new` uploads photos before the product (and its
   * slug) exists, so the key falls back to `product-<nonce>`.
   */
  slug: z.string().trim().max(120).optional(),
  contentType: z.enum(ALLOWED_IMAGE_TYPES),
  size: z.number().int().min(1).max(MAX_UPLOAD_BYTES).optional(),
});

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/**
 * Issues a short-lived R2 PUT URL so the browser uploads the photo directly to
 * storage — the image never passes through the Next.js server.
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!isAdmin(session.user)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
  }

  if (!isR2Configured()) {
    return NextResponse.json({ error: "storage_unavailable" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const key = productImageKey(parsed.data.slug ?? "", parsed.data.contentType);

  try {
    const uploadUrl = await createUploadUrl({
      key,
      contentType: parsed.data.contentType,
      expiresIn: 300,
    });

    return NextResponse.json({ key, uploadUrl, publicUrl: publicObjectUrl(key) });
  } catch (error) {
    console.error("R2 upload signing failed", error);
    return NextResponse.json({ error: "storage_error" }, { status: 502 });
  }
}
