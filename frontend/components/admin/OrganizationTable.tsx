'use client';

import { CheckCircle2, Clock, ExternalLink, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-brand-primary/10 text-brand-primary',
  PENDING: 'bg-brand-accent/10 text-brand-accent',
  SUSPENDED: 'bg-brand-error/10 text-brand-error',
};

interface Organization {
  id: string;
  name: string;
  email: string | null;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
  _count: { users: number; documents: number };
}

interface OrganizationTableProps {
  orgs: Organization[];
}

export function OrganizationTable({ orgs = [] }: OrganizationTableProps) {
  const formattedOrgs = useMemo(
    () =>
      orgs.map((org) => ({
        ...org,
        formattedCreatedAt: new Date(org.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      })),
    [orgs],
  );

  return (
    <div className="bg-brand-surface rounded-2xl border border-brand-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-bg">
              <th
                scope="col"
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
              >
                Organization
              </th>
              <th
                scope="col"
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide"
              >
                Status
              </th>
              <th
                scope="col"
                className="text-center px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden sm:table-cell"
              >
                Staff
              </th>
              <th
                scope="col"
                className="text-center px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden md:table-cell"
              >
                Docs
              </th>
              <th
                scope="col"
                className="text-left px-4 py-3 text-xs font-semibold text-brand-muted uppercase tracking-wide hidden lg:table-cell"
              >
                Registered
              </th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {formattedOrgs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-brand-muted text-sm">
                  No organizations found
                </td>
              </tr>
            ) : (
              formattedOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-brand-bg/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-brand-text">{org.name}</span>
                      <span className="text-xs text-brand-muted">{org.email ?? 'No email'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      {org.status === 'ACTIVE' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
                      ) : org.status === 'PENDING' ? (
                        <Clock className="w-3.5 h-3.5 text-brand-accent" />
                      ) : (
                        <ShieldAlert className="w-3.5 h-3.5 text-brand-error" />
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLORS[org.status] ?? ''}`}
                      >
                        {org.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center text-brand-text font-medium hidden sm:table-cell">
                    {org._count.users}
                  </td>
                  <td className="px-4 py-4 text-center hidden md:table-cell">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-xs ${org._count.documents > 0 ? 'bg-brand-bg text-brand-text border border-brand-border' : 'text-brand-muted'}`}
                    >
                      {org._count.documents}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-brand-muted text-xs hidden lg:table-cell">
                    {org.formattedCreatedAt}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-secondary transition-colors bg-brand-primary/5 px-3 py-3 rounded-lg border border-brand-primary/10 min-h-[44px] focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:outline-none"
                    >
                      Manage
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
