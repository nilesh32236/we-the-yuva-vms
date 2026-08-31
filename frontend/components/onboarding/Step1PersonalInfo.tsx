'use client';

import { FileUpload } from '@/components/shared/FileUpload';
import { cn } from '@/lib/utils';
import type { StepProps } from './StepProps';
import { FieldError } from './StepProps';

const inputBase =
  'w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-brand-primary';

export function Step1PersonalInfo({ register, setValue, watch, errors }: StepProps) {
  const avatarUrl = watch('avatarUrl');
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <FileUpload
          label="Profile Photo"
          accept="image/*"
          previewUrl={avatarUrl ?? null}
          onUpload={(url) => setValue('avatarUrl', url, { shouldValidate: true, shouldDirty: true })}
        />
        <FieldError message={errors.avatarUrl?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label htmlFor="city" className="text-sm font-medium text-brand-text">City *</label>
          <input
            id="city"
            aria-invalid={!!errors.address?.city}
            aria-describedby={errors.address?.city ? 'city-error' : undefined}
            className={cn(inputBase, errors.address?.city ? 'border-brand-error' : 'border-brand-border')}
            {...register('address.city')}
          />
          <FieldError message={errors.address?.city?.message} />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label htmlFor="district" className="text-sm font-medium text-brand-text">District *</label>
          <input
            id="district"
            aria-invalid={!!errors.address?.district}
            aria-describedby={errors.address?.district ? 'district-error' : undefined}
            className={cn(inputBase, errors.address?.district ? 'border-brand-error' : 'border-brand-border')}
            {...register('address.district')}
          />
          <FieldError message={errors.address?.district?.message} />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label htmlFor="state" className="text-sm font-medium text-brand-text">State *</label>
          <input
            id="state"
            aria-invalid={!!errors.address?.state}
            aria-describedby={errors.address?.state ? 'state-error' : undefined}
            className={cn(inputBase, errors.address?.state ? 'border-brand-error' : 'border-brand-border')}
            {...register('address.state')}
          />
          <FieldError message={errors.address?.state?.message} />
        </div>
        <div className="space-y-1.5 col-span-2 sm:col-span-1">
          <label htmlFor="pincode" className="text-sm font-medium text-brand-text">PIN Code *</label>
          <input
            id="pincode"
            inputMode="numeric"
            maxLength={6}
            aria-invalid={!!errors.address?.pincode}
            aria-describedby={errors.address?.pincode ? 'pincode-error' : undefined}
            className={cn(inputBase, errors.address?.pincode ? 'border-brand-error' : 'border-brand-border')}
            {...register('address.pincode')}
          />
          <FieldError message={errors.address?.pincode?.message} />
        </div>
      </div>
    </div>
  );
}
