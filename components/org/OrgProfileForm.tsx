'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
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
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description ?? '');
  const [logo, setLogo] = useState(org.logo ?? '');
  const [phone, setPhone] = useState(org.phone ?? '');
  const [email, setEmail] = useState(org.email ?? '');
  const [website, setWebsite] = useState(org.website ?? '');
  const [address, setAddress] = useState(org.address ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Organization name is required';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email format';
    if (website && !/^https?:\/\/.+/.test(website)) errs.website = 'Must be a valid URL (http/https)';
    if (logo && !/^https?:\/\/.+/.test(logo)) errs.logo = 'Must be a valid URL (http/https)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const mutation = useMutation({
    mutationFn: (body: object) => api.patch(`/organizations/${org.id}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organization', org.id] });
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      toast({ title: 'Organization profile updated successfully' });
      onCancel();
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast({
        title: 'Error',
        description: err?.response?.data?.error || 'Failed to update organization',
        variant: 'destructive',
      });
    },
  });

  function handleSave() {
    if (!validate()) return;
    mutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      logo: logo.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
    });
  }

  const inputCls = (field: string) =>
    `w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 transition-colors bg-background ${
      errors[field]
        ? 'border-brand-error focus:ring-brand-error/30 bg-brand-error/5'
        : 'border-brand-border focus:ring-brand-primary/30'
    }`;

  return (
    <div className="space-y-5" data-profile-editor>
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="org-name" className="text-sm font-medium text-brand-text">Organization Name</label>
          <input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls('name')}
            placeholder="Organization name"
          />
          {errors.name && <p className="text-xs text-brand-error">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="org-description" className="text-sm font-medium text-brand-text">Description</label>
          <textarea
            id="org-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputCls('description')}
            placeholder="Describe your organization…"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="org-logo" className="text-sm font-medium text-brand-text">Logo URL</label>
          <input
            id="org-logo"
            value={logo}
            onChange={(e) => setLogo(e.target.value)}
            className={inputCls('logo')}
            placeholder="https://example.com/logo.png"
          />
          {errors.logo && <p className="text-xs text-brand-error">{errors.logo}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="org-phone" className="text-sm font-medium text-brand-text">Phone</label>
          <input
            id="org-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls('phone')}
            placeholder="+91 12345 67890"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="org-email" className="text-sm font-medium text-brand-text">Email</label>
          <input
            id="org-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls('email')}
            placeholder="contact@organization.org"
          />
          {errors.email && <p className="text-xs text-brand-error">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="org-website" className="text-sm font-medium text-brand-text">Website</label>
          <input
            id="org-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className={inputCls('website')}
            placeholder="https://organization.org"
          />
          {errors.website && <p className="text-xs text-brand-error">{errors.website}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="org-address" className="text-sm font-medium text-brand-text">Address</label>
          <input
            id="org-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputCls('address')}
            placeholder="Organization address"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" fullWidth onClick={onCancel}>
          <X className="w-4 h-4" /> Cancel
        </Button>
        <Button variant="primary" fullWidth onClick={handleSave} loading={mutation.isPending}>
          <Check className="w-4 h-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
