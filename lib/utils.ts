import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names with Tailwind conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteUrl(
  path = "/",
  base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
): string {
  try {
    return new URL(path, base).toString();
  } catch {
    return path;
  }
}

export function formatDate(
  value: Date | string | number,
  dateLocale = "en-GB",
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(dateLocale, options).format(date);
}

export function formatDateTime(value: Date | string | number, dateLocale = "en-GB"): string {
  return formatDate(value, dateLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[æÆ]/g, "ae")
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `LB-261117-K3F9` — the DB unique constraint is the real guard. */
export function generateOrderNumber(date = new Date()): string {
  const stamp = [
    date.getFullYear().toString().slice(-2),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");

  const suffix = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");

  return `LB-${stamp}-${suffix}`;
}

export function truncate(value: string, max = 160): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
