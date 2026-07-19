'use client';

import type { UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { CAUSES, INTEREST_OPTIONS, PREFERRED_ACTIVITIES, type OnboardingData } from '@/lib/shared';
import { ChipSelect } from './ChipSelect';

interface StepInterestsProps {
  setValue: UseFormSetValue<OnboardingData>;
  watch: UseFormWatch<OnboardingData>;
  errors: FieldErrors<OnboardingData>;
}

export function StepInterests({ setValue, watch, errors }: StepInterestsProps) {
  const causes = watch('step2.causes') ?? [];
  const interests = watch('step2.interests') ?? [];
  const preferredActivities = watch('step2.preferredActivities') ?? [];

  const toggleCauses = (val: string) => {
    const next = causes.includes(val) ? causes.filter((v) => v !== val) : [...causes, val];
    setValue('step2.causes', next as never, { shouldValidate: true });
  };

  const toggleInterests = (val: string) => {
    const next = interests.includes(val) ? interests.filter((v) => v !== val) : [...interests, val];
    setValue('step2.interests', next as never, { shouldValidate: true });
  };

  const toggleActivities = (val: string) => {
    const next = preferredActivities.includes(val)
      ? preferredActivities.filter((v) => v !== val)
      : [...preferredActivities, val];
    setValue('step2.preferredActivities', next as never, { shouldValidate: true });
  };

  return (
    <>
      <h2 className="font-heading font-semibold text-xl text-brand-text">Interests & Causes</h2>
      <p className="text-brand-muted text-sm -mt-3">What matters most to you?</p>

      <div className="space-y-5">
        <div className="space-y-2">
          <span className="text-sm font-medium text-brand-text">Causes You Care About *</span>
          <p className="text-xs text-brand-muted">Select the causes you're passionate about</p>
          <ChipSelect
            options={CAUSES}
            selected={causes}
            toggle={toggleCauses}
            labelMap={{
              EDUCATION: 'Education',
              HEALTH: 'Health',
              ENVIRONMENT: 'Environment',
              COMMUNITY: 'Community',
              ARTS: 'Arts & Culture',
              SPORTS: 'Sports',
              TECHNOLOGY: 'Technology',
              ACTIVE_CITIZENSHIP: 'Active Citizenship',
              OTHER: 'Other',
            }}
            error={errors.step2?.causes?.message}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-brand-text">Interest Areas</span>
          <p className="text-xs text-brand-muted">What specific areas interest you? (optional)</p>
          <ChipSelect
            options={INTEREST_OPTIONS}
            selected={interests}
            toggle={toggleInterests}
            labelMap={{
              TEACHING_MENTORING: 'Teaching & Mentoring',
              HEALTHCARE: 'Healthcare',
              ENVIRONMENT_CONSERVATION: 'Environment Conservation',
              COMMUNITY_SERVICE: 'Community Service',
              ARTS_CULTURE: 'Arts & Culture',
              SPORTS_COACHING: 'Sports Coaching',
              DIGITAL_LITERACY: 'Digital Literacy',
              WOMEN_EMPOWERMENT: "Women's Empowerment",
              YOUTH_DEVELOPMENT: 'Youth Development',
              DISASTER_RELIEF: 'Disaster Relief',
              ANIMAL_WELFARE: 'Animal Welfare',
              RURAL_DEVELOPMENT: 'Rural Development',
            }}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-brand-text">Preferred Activities</span>
          <p className="text-xs text-brand-muted">
            What kind of activities do you enjoy? (optional)
          </p>
          <ChipSelect
            options={PREFERRED_ACTIVITIES}
            selected={preferredActivities}
            toggle={toggleActivities}
            labelMap={{
              FIELD_WORK: 'Field Work',
              OFFICE_SUPPORT: 'Office Support',
              TEACHING: 'Teaching',
              EVENT_MANAGEMENT: 'Event Management',
              CONTENT_CREATION: 'Content Creation',
              PHOTOGRAPHY: 'Photography',
              SOCIAL_MEDIA: 'Social Media',
              FUNDRAISING: 'Fundraising',
              DATA_ENTRY: 'Data Entry',
              COUNSELLING: 'Counselling',
              MENTORING: 'Mentoring',
              RESEARCH: 'Research',
            }}
          />
        </div>
      </div>
    </>
  );
}
