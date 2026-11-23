import type { EmailStatus, EmailType } from "@prisma/client";
import { EmailType as EmailTypeEnum } from "@prisma/client";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmailStatusBadge } from "@/components/admin/EmailStatusBadge";
import { getDictionary } from "@/lib/dictionaries";
import { isLocale } from "@/lib/i18n";
import { MAIL_TEMPLATES } from "@/lib/mail-catalog";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

type PageProps = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ type?: string; status?: string }>;
};

export const metadata: Metadata = { robots: { index: false, follow: false } };

const EMAIL_STATUSES = ["PENDING", "SENT", "FAILED"] as const;

function isEmailType(value: unknown): value is EmailType {
  return (
    typeof value === "string" &&
    (Object.values(EmailTypeEnum) as readonly string[]).includes(value)
  );
}

function isEmailStatus(value: unknown): value is EmailStatus {
  return typeof value === "string" && (EMAIL_STATUSES as readonly string[]).includes(value);
}

export default async function AdminEmailPage({ params, searchParams }: PageProps) {
  const { lang } = await params;

  if (!isLocale(lang)) notFound();

  await requireAdmin(`/${lang}`);

  const { type, status } = await searchParams;
  const typeFilter = isEmailType(type) ? type : undefined;
  const statusFilter = isEmailStatus(status) ? status : undefined;

  const [dict, logs] = await Promise.all([
    getDictionary(lang),
    prisma.emailLog.findMany({
      where: {
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        to: true,
        subject: true,
        status: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
  ]);

  const labels = dict.adminEmail;
  const timestamp = new Intl.DateTimeFormat(lang === "no" ? "nb-NO" : "en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });

  const statusHref = (value?: EmailStatus) => {
    const query = new URLSearchParams();
    if (value) query.set("status", value);
    if (typeFilter) query.set("type", typeFilter);
    const suffix = query.toString();
    return `/${lang}/admin/email${suffix ? `?${suffix}` : ""}`;
  };

  return (
    <section>
      <div>
        <p className="eyebrow">{labels.title}</p>
        <h1 className="mt-2 text-3xl">{labels.subtitle}</h1>
      </div>

      <div className="mt-6">
        <h2 className="text-lg">{labels.templatesTitle}</h2>
        <p className="mt-1 text-sm text-mocha">{labels.templatesHint}</p>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
              <th scope="col" className="p-3 font-medium">
                {labels.name}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.recipients}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.trigger}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.languages}
              </th>
              <th scope="col" className="p-3 font-medium">
                <span className="sr-only">{labels.preview}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {MAIL_TEMPLATES.map((template) => (
              <tr key={template.key} className="border-b border-cocoa/5 last:border-0">
                <td className="p-3">
                  <Link
                    href={`/${lang}/admin/email/${template.key}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {labels.templateNames[template.key]}
                  </Link>
                  {labels.typeLabels[template.type] !== labels.templateNames[template.key] ? (
                    <p className="text-xs text-mocha">{labels.typeLabels[template.type]}</p>
                  ) : null}
                </td>
                <td className="p-3 text-mocha">
                  {template.audience === "customer" ? labels.customer : labels.bakery}
                </td>
                <td className="p-3 text-mocha">{labels.templateDescriptions[template.key]}</td>
                <td className="p-3 text-mocha">
                  {template.locales
                    .map((locale) => (locale === "no" ? labels.norwegian : labels.english))
                    .join(" · ")}
                </td>
                <td className="p-3 text-right">
                  <Link
                    href={`/${lang}/admin/email/${template.key}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {labels.preview}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg">{labels.logTitle}</h2>
          <p className="mt-1 text-sm text-mocha">{labels.logHint}</p>
        </div>

        <form
          action={`/${lang}/admin/email`}
          method="get"
          className="flex flex-wrap items-center gap-2"
        >
          {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
          <label className="sr-only" htmlFor="email-type">
            {labels.type}
          </label>
          <select
            id="email-type"
            name="type"
            defaultValue={typeFilter ?? ""}
            className="rounded-lg border border-cocoa/20 bg-white px-3 py-1.5 text-sm"
          >
            <option value="">{labels.allTypes}</option>
            {(Object.values(EmailTypeEnum) as EmailType[]).map((value) => (
              <option key={value} value={value}>
                {labels.typeLabels[value]}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-outline">
            {labels.filter}
          </button>
        </form>
      </div>

      <nav aria-label={labels.status} className="mt-4 flex flex-wrap gap-2 text-xs">
        {[{ value: undefined as EmailStatus | undefined, label: labels.allStatuses }].concat(
          EMAIL_STATUSES.map((value) => ({ value, label: labels.statusLabels[value] })),
        ).map((pill) => (
          <Link
            key={pill.label}
            href={statusHref(pill.value)}
            aria-current={statusFilter === pill.value ? "page" : undefined}
            className={`rounded-full border px-3 py-1 transition ${
              statusFilter === pill.value
                ? "border-cocoa bg-cocoa text-white"
                : "border-cocoa/15 hover:border-cocoa/30"
            }`}
          >
            {pill.label}
          </Link>
        ))}
      </nav>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-cocoa/10 text-left text-xs uppercase tracking-wider text-mocha">
              <th scope="col" className="p-3 font-medium">
                {labels.time}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.type}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.to}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.subject}
              </th>
              <th scope="col" className="p-3 font-medium">
                {labels.status}
              </th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-mocha">
                  {labels.empty}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-cocoa/5 last:border-0">
                  <td className="p-3 whitespace-nowrap text-mocha">
                    {timestamp.format(log.createdAt)}
                  </td>
                  <td className="p-3 text-mocha">{labels.typeLabels[log.type]}</td>
                  <td className="p-3 text-mocha">{log.to}</td>
                  <td className="p-3">
                    <p>{log.subject}</p>
                    {log.errorMessage ? (
                      <p className="text-xs text-berry">
                        {labels.errorLabel}: {log.errorMessage}
                      </p>
                    ) : null}
                  </td>
                  <td className="p-3">
                    <EmailStatusBadge status={log.status} labels={labels.statusLabels} />
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