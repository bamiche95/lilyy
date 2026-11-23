import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { UserRoleForm } from "@/components/admin/UserRoleForm";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale, LOCALE_META } from "@/lib/i18n";
import { prisma, type Prisma } from "@/lib/prisma";
import { requireAdmin, USER_ROLES, type UserRole } from "@/lib/session";

type PageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; role?: string }>;
};

export const metadata: Metadata = { robots: { index: false, follow: false } };

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

export default async function AdminUsersPage({ params, searchParams }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  const session = await requireAdmin(`/${lang}`);

  const { q, role } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const roleFilter = isUserRole(role) ? role : undefined;

  const where: Prisma.UserWhereInput = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [dict, users] = await Promise.all([
    getDictionary(lang),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        locale: true,
        createdAt: true,
        _count: { select: { orders: true, supportThreads: true } },
      },
    }),
  ]);

  const labels = dict.adminUsers;
  const dateFormatter = new Intl.DateTimeFormat(LOCALE_META[lang].dateLocale, {
    dateStyle: "medium",
  });
  const pills: { value: UserRole | undefined; label: string; href: string }[] = [
    { value: undefined, label: labels.allRoles, href: `/${lang}/admin/users` },
    ...USER_ROLES.map((value) => ({
      value,
      label: value === "admin" ? labels.admin : labels.customer,
      href: `/${lang}/admin/users?role=${value}`,
    })),
  ];

  return (
    <section>
      <div>
        <p className="eyebrow">{labels.title}</p>
        <h1 className="mt-2 text-3xl">{labels.subtitle}</h1>
        <p className="mt-2 text-sm text-mocha">
          {users.length} {users.length === 1 ? dict.shop.resultsOne : dict.shop.resultsMany}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <nav aria-label={labels.filter} className="flex flex-wrap gap-2 text-xs">
          {pills.map((pill) => (
            <Link
              key={pill.label}
              href={pill.href}
              aria-current={roleFilter === pill.value ? "page" : undefined}
              className={`rounded-full border px-3 py-1 transition ${
                roleFilter === pill.value
                  ? "border-cocoa bg-cocoa text-white"
                  : "border-cocoa/15 hover:border-cocoa/30"
              }`}
            >
              {pill.label}
            </Link>
          ))}
        </nav>

        <form action={`/${lang}/admin/users`} method="get" className="flex flex-wrap items-center gap-2">
          {roleFilter ? <input type="hidden" name="role" value={roleFilter} /> : null}
          <label className="sr-only" htmlFor="user-search">
            {labels.search}
          </label>
          <input
            id="user-search"
            name="q"
            type="search"
            defaultValue={query}
            placeholder={labels.search}
            className="rounded-lg border border-cocoa/20 bg-white px-3 py-1.5 text-sm"
          />
          <button type="submit" className="btn btn-outline">
            {dict.common.search}
          </button>
          {query ? (
            <Link
              href={`/${lang}/admin/users${roleFilter ? `?role=${roleFilter}` : ""}`}
              className="text-xs text-mocha underline-offset-2 hover:underline"
            >
              {labels.clear}
            </Link>
          ) : null}
        </form>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
              <th scope="col" className="p-3 font-medium">
                {dict.adminOrders.customer}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.role}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.orders}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.language}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.joined}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.verified}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-mocha">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-cocoa/5 last:border-0">
                  <td className="p-3">
                    <p className="font-medium">
                      {user.name}
                      {user.id === session.user.id ? (
                        <span className="ml-2 text-xs text-mocha">({labels.you})</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-mocha">{user.email}</p>
                  </td>
                  <td className="p-3 align-top">
                    <UserRoleForm
                      userId={user.id}
                      role={isUserRole(user.role) ? user.role : "customer"}
                      isSelf={user.id === session.user.id}
                      labels={labels}
                    />
                  </td>
                  <td className="p-3 text-mocha">
                    <p className="font-medium text-cocoa">{user._count.orders}</p>
                    <p className="text-xs">
                      {user._count.supportThreads} {dict.nav.support.toLowerCase()}
                    </p>
                  </td>
                  <td className="p-3 text-mocha">
                    {LOCALE_META[user.locale === "no" ? "no" : "en"].label}
                  </td>
                  <td className="p-3 text-mocha">{dateFormatter.format(user.createdAt)}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs ${
                        user.emailVerified
                          ? "border-emerald-600/30 bg-emerald-50 text-emerald-800"
                          : "border-cocoa/20 bg-crust text-mocha"
                      }`}
                    >
                      {user.emailVerified ? labels.verified : labels.unverified}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}