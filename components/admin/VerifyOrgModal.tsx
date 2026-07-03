'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, X } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { api } from '../../lib/api';

interface OrgDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  type: string;
  uploadedAt: string;
}

interface VerifyOrgModalProps {
  org: {
    id: string;
    name: string;
    email: string | null;
    status: string;
  };
  onClose: () => void;
}

export function VerifyOrgModal({ org, onClose }: VerifyOrgModalProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: docs, isLoading: loadingDocs } = useQuery({
    queryKey: ['admin-org-docs', org.id],
    queryFn: () =>
      api.get<OrgDocument[]>(`/admin/organizations/${org.id}/documents`).then((r) => r.data),
  });

  const verifyMut = useMutation({
    mutationFn: (approved: boolean) =>
      api.patch(`/admin/organizations/${org.id}/verify`, { approved }),
    onSuccess: (_, approved) => {
      qc.invalidateQueries({ queryKey: ['admin-orgs'] });
      toast({
        title: approved ? 'Organization verified' : 'Organization rejected',
        description: `${org.name} status updated to ${approved ? 'Active' : 'Suspended'}.`,
      });
      onClose();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Could not update organization.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-surface rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="font-heading font-bold text-lg text-brand-text">Verify Organization</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-brand-bg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-brand-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-2">
              Details
            </h3>
            <div className="bg-brand-bg rounded-xl p-4 space-y-1">
              <p className="font-bold text-brand-text">{org.name}</p>
              <p className="text-sm text-brand-muted">{org.email}</p>
              <p className="text-xs mt-2 uppercase font-bold text-brand-muted/50">
                Status: {org.status}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-brand-muted uppercase tracking-wider mb-3">
              Verification Documents
            </h3>
            {loadingDocs ? (
              <div className="space-y-2">
                <div className="h-12 bg-brand-bg animate-pulse rounded-xl" />
                <div className="h-12 bg-brand-bg animate-pulse rounded-xl" />
              </div>
            ) : !docs?.length ? (
              <p className="text-sm text-brand-muted italic">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-2">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-brand-border rounded-xl hover:bg-brand-bg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-brand-text truncate max-w-[200px]">
                          {doc.fileName}
                        </p>
                        <p className="text-[10px] text-brand-muted uppercase">
                          {doc.type.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-brand-muted hover:text-brand-primary transition-colors"
                      aria-label="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={() => verifyMut.mutate(false)}
            disabled={verifyMut.isPending}
            className="flex-1 py-2.5 rounded-xl border border-brand-error text-brand-error text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors disabled:opacity-50"
          >
            Reject / Suspend
          </button>
          <button
            type="button"
            onClick={() => verifyMut.mutate(true)}
            disabled={verifyMut.isPending}
            className="flex-1 py-2.5 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-secondary cursor-pointer transition-colors disabled:opacity-50 shadow-sm"
          >
            {verifyMut.isPending ? 'Processing...' : 'Approve & Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}
