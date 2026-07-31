'use client';

import type { UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { EXPERTISE_OPTIONS, LANGUAGES, type OnboardingData } from '@/lib/shared';
import { ChipSelect } from './ChipSelect';

interface StepSkillsProps {
  setValue: UseFormSetValue<OnboardingData>;
  watch: UseFormWatch<OnboardingData>;
  errors: FieldErrors<OnboardingData>;
}

const SKILL_LABELS = {
  TEACHING: 'Teaching',
  PUBLIC_SPEAKING: 'Public Speaking',
  EVENT_MANAGEMENT: 'Event Management',
  PHOTOGRAPHY: 'Photography',
  GRAPHIC_DESIGN: 'Graphic Design',
  SOCIAL_MEDIA: 'Social Media',
  CONTENT_WRITING: 'Content Writing',
  FUNDRAISING: 'Fundraising',
  COUNSELLING: 'Counselling',
  LEADERSHIP: 'Leadership',
  PROJECT_MANAGEMENT: 'Project Management',
  WEB_DEVELOPMENT: 'Web Development',
  SOFTWARE_DEVELOPMENT: 'Software Development',
  VIDEO_EDITING: 'Video Editing',
  TRANSLATION: 'Translation',
  FIRST_AID: 'First Aid',
  ACCOUNTING: 'Accounting',
  LEGAL_SUPPORT: 'Legal Support',
  DATA_ENTRY: 'Data Entry',
  ADMINISTRATION: 'Administration',
} as const;

export function StepSkills({ setValue, watch, errors }: StepSkillsProps) {
  const skills = watch('step1.skills') ?? [];
  const expertise = watch('step1.expertise') ?? [];
  const languages = watch('step1.languages') ?? [];

  const toggleSkills = (val: string) => {
    const next = skills.includes(val) ? skills.filter((v) => v !== val) : [...skills, val];
    setValue('step1.skills', next, { shouldValidate: true });
  };

  const toggleExpertise = (val: string) => {
    const next = expertise.includes(val) ? expertise.filter((v) => v !== val) : [...expertise, val];
    setValue('step1.expertise', next, { shouldValidate: true });
  };

  const toggleLanguage = (val: string) => {
    const next = languages.includes(val) ? languages.filter((v) => v !== val) : [...languages, val];
    setValue('step1.languages', next, { shouldValidate: true });
  };

  return (
    <>
      <h2 className="font-heading font-semibold text-xl text-brand-text">Skills & Languages</h2>
      <p className="text-brand-muted text-sm -mt-3">
        Tell us about your skills and languages you speak
      </p>

      <div className="space-y-5">
        <div className="space-y-2">
          <span className="text-sm font-medium text-brand-text">Skills *</span>
          <p className="text-xs text-brand-muted">Select the skills you can bring as a volunteer</p>
          <ChipSelect
            options={EXPERTISE_OPTIONS}
            selected={skills}
            toggle={toggleSkills}
            labelMap={SKILL_LABELS}
            error={errors.step1?.skills?.message}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-brand-text">Areas of Expertise</span>
          <p className="text-xs text-brand-muted">Select your strongest areas (optional)</p>
          <ChipSelect
            options={EXPERTISE_OPTIONS}
            selected={expertise}
            toggle={toggleExpertise}
            labelMap={SKILL_LABELS}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium text-brand-text">Languages</span>
          <p className="text-xs text-brand-muted">Which languages do you speak? (optional)</p>
          <ChipSelect
            options={LANGUAGES}
            selected={languages}
            toggle={toggleLanguage}
            labelMap={{
              HINDI: 'Hindi',
              ENGLISH: 'English',
              GUJARATI: 'Gujarati',
              MARATHI: 'Marathi',
              TAMIL: 'Tamil',
              TELUGU: 'Telugu',
              OTHER: 'Other',
            }}
          />
        </div>
      </div>
    </>
  );
}
