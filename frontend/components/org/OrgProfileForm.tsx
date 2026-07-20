'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { type RegisterOrganizationInput, RegisterOrganizationSchema } from '@/lib/shared';
import { Button } from '../ui/Button';

interface OrgData {
  id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
}

interface OrgProfileFormProps {
  org: OrgData;
  onCancel: () => void;
}

export default function OrgProfileForm({ org, onCancel }: OrgProfileFormProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [logo, setLogo] = useState(org.logo ?? '');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterOrganizationInput>({
    resolver: zodResolver(RegisterOrganizationSchema),
    defaultValues: {
      name: org.name,
      description: org.description ?? undefined,
      phone: org.phone ?? undefined,
      email: org.email ?? undefined,
      website: org.website ?? undefined,
      address: org.address ?? undefined,
    },
  });

  const mutation = useMutation({
    mutationFn: (body: RegisterOrganizationInput & { logo?: string }) =>
      api.patch(`/organizations/${org.id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations', org.id] });
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      toast({ title: 'Organization profile updated successfully' });
      onCancel();
    },
    onError: (err: unknown) => {
      const axiosErr = err as { normalizedMessage?: string };
      toast({
        title: 'Error',
        description: axiosErr?.normalizedMessage ?? 'Failed to update organization',
        variant: 'destructive',
      });
    },
  });

  if (!org) return null;

  function onSave(data: RegisterOrganizationInput) {
    mutation.mutate({ ...data, logo: logo.trim() || undefined });
  }

  const inputCls = (field: string) =>
    `w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors bg-background ${
      errors[field as keyof typeof errors]
        ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5'
        : 'border-brand-border focus:ring-brand-primary/30'
    }`;

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSave)} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="org-name" className="text-sm font-medium text-brand-text">
            Organization Name
          </label>
          <input
            id="org-name"
            {...register('name', {
              setValueAs: (v: string) => v,
            })}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'org-name-error' : undefined}
            className={inputCls('name')}
            placeholder="Organization name"
          />
          {errors.name && (
            <p id="org-name-error" className="text-xs text-brand-error">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="org-description" className="text-sm font-medium text-brand-text">
            Description
          </label>
          <textarea
            id="org-description"
            {...register('description')}
            rows={3}
            className={inputCls('description')}
            placeholder="Describe your organization…"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="org-logo" className="text-sm font-medium text-brand-text">
            Logo URL
          </label>
          <input
            id="org-logo"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            className="w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors bg-background border-brand-border focus:ring-brand-primary/30"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="org-phone" className="text-sm font-medium text-brand-text">
            Phone
          </label>
          <input
            id="org-phone"
            {...register('phone')}
            className={inputCls('phone')}
            placeholder="+91 12345 67890"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="org-email" className="text-sm font-medium text-brand-text">
            Email
          </label>
          <input
            id="org-email"
            {...register('email')}
            className={inputCls('email')}
            placeholder="contact@organization.org"
          />
          {errors.email && (
            <p className="text-xs text-brand-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="org-website" className="text-sm font-medium text-brand-text">
            Website
          </label>
          <input
            id="org-website"
            {...register('website')}
            className={inputCls('website')}
            placeholder="https://organization.org"
          />
          {errors.website && <p className="text-xs text-brand-error">{errors.website.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="org-address" className="text-sm font-medium text-brand-text">
            Address
          </label>
          <input
            id="org-address"
            {...register('address')}
            className={inputCls('address')}
            placeholder="Organization address"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" fullWidth onClick={onCancel} type="button">
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button variant="primary" fullWidth loading={mutation.isPending} type="submit">
            <Check className="w-4 h-4" /> Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
