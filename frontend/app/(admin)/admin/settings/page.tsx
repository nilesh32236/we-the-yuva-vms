// Phase 2: Outside MVP Phase 1 scope. Keep for Phase 2 implementation.
// See /issues/PHASE2_SCOPE.md
'use client';

import { Settings } from 'lucide-react';

const CATEGORIES = [
  'EDUCATION',
  'HEALTH',
  'ENVIRONMENT',
  'COMMUNITY',
  'ARTS',
  'SPORTS',
  'TECHNOLOGY',
  'ACTIVE_CITIZENSHIP',
  'OTHER',
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-heading font-bold text-xl text-brand-text">System Settings</h1>

      {/* Categories */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text">
          Opportunity Categories
        </h2>
        <p className="text-xs text-brand-muted">
          Categories are managed via database configuration.
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <span
              key={cat}
              className="text-xs font-medium bg-brand-bg border border-brand-border px-2.5 py-1 rounded-full text-brand-text"
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Matching Rules */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text">
          Volunteer Matching Rules
        </h2>
        <div className="space-y-2 text-sm text-brand-muted">
          <div className="flex items-center justify-between p-3 bg-brand-bg rounded-xl">
            <span>Skill overlap weight</span>
            <span className="font-semibold text-brand-text">50%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-brand-bg rounded-xl">
            <span>Interest match weight</span>
            <span className="font-semibold text-brand-text">30%</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-brand-bg rounded-xl">
            <span>Availability match weight</span>
            <span className="font-semibold text-brand-text">20%</span>
          </div>
        </div>
        <p className="text-xs text-brand-muted">
          Weights are configured in the matching engine source code.
        </p>
      </div>

      {/* Audit Log */}
      <div className="bg-brand-surface rounded-2xl border border-brand-border p-5 space-y-3">
        <h2 className="font-heading font-semibold text-sm text-brand-text">Admin Audit Log</h2>
        <p className="text-xs text-brand-muted">
          All admin actions (user suspensions, role changes) are automatically logged with
          timestamps and can be viewed in the database.
        </p>
      </div>

      <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 text-center">
        <Settings className="w-8 h-8 text-brand-muted mx-auto mb-2" />
        <p className="text-sm text-brand-muted">Advanced configuration options coming soon</p>
      </div>
    </div>
  );
}
