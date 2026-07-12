'use client';

import { BadgeApprovalQueue } from '../../../../components/badges/BadgeApprovalQueue';

export default function AdminBadgesPage() {
  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="font-heading font-bold text-xl text-brand-text">Badge Approvals</h1>
        <p className="text-brand-muted text-sm mt-0.5">
          Review and approve volunteer progression badges.
        </p>
      </div>
      <BadgeApprovalQueue />
    </div>
  );
}
