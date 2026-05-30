'use client';

import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DAYS, TIME_SLOTS } from '@/lib/shared';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../hooks/use-toast';
import { useAuth } from '../../../hooks/useAuth';
import { api } from '../../../lib/api';

// ─── Tag Input ────────────────────────────────────────────────────

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      const tag = input.trim().replace(/,$/, '');
      if (tag && !tags.includes(tag) && tags.length < 20) {
        onAdd(tag);
        setInput('');
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[40px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-brand-bg border border-brand-border
              text-brand-text text-sm px-3 py-1 rounded-full"
          >
            {tag}
            <Button variant="icon" onClick={() => onRemove(tag)} aria-label={`Remove ${tag}`}>
              <X className="w-3 h-3" />
            </Button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-lg border border-brand-border text-sm
            focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
        />
        <Button
          variant="icon"
          onClick={() => {
            const tag = input.trim();
            if (tag && !tags.includes(tag) && tags.length < 20) {
              onAdd(tag);
              setInput('');
            }
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-primary"
          aria-label="Add tag"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-brand-muted">Press Enter or comma to add. Max 20.</p>
    </div>
  );
}

// ─── Volunteer Profile Form ───────────────────────────────────────

function VolunteerProfileForm({ onComplete }: { onComplete: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleDay = (day: string) =>
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const toggleSlot = (slot: string) =>
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );

  const handleSubmit = async () => {
    if (
      skills.length === 0 ||
      interests.length === 0 ||
      selectedDays.length === 0 ||
      selectedSlots.length === 0
    ) {
      toast({ title: 'Please complete all fields', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      await api.post('/users/me/profile', {
        skills,
        interests,
        availability: { days: selectedDays, timeSlots: selectedSlots },
      });
      onComplete();
    } catch {
      toast({
        title: 'Error',
        description: 'Could not save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (step / 3) * 100;

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-brand-muted">
          <span>Step {step} of 3</span>
          <span>{step === 1 ? 'Skills' : step === 2 ? 'Interests' : 'Availability'}</span>
        </div>
        <div className="h-2 bg-brand-border rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 space-y-5">
        {step === 1 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">
              What skills do you have?
            </h2>
            <TagInput
              tags={skills}
              onAdd={(t) => setSkills([...skills, t])}
              onRemove={(t) => setSkills(skills.filter((s) => s !== t))}
              placeholder="e.g. Teaching, First Aid..."
            />
            <Button
              variant="cta"
              fullWidth
              onClick={() => skills.length > 0 && setStep(2)}
              disabled={skills.length === 0}
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">
              What are your interests?
            </h2>
            <TagInput
              tags={interests}
              onAdd={(t) => setInterests([...interests, t])}
              onRemove={(t) => setInterests(interests.filter((i) => i !== t))}
              placeholder="e.g. Education, Health..."
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                variant="cta"
                className="flex-1"
                onClick={() => interests.length > 0 && setStep(3)}
                disabled={interests.length === 0}
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-heading font-semibold text-xl text-brand-text">
              When are you available?
            </h2>
            <div className="space-y-3">
              <p className="text-sm font-medium text-brand-text">Days</p>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer
                      ${selectedDays.includes(day) ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-text hover:border-brand-primary'}`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
              <p className="text-sm font-medium text-brand-text">Time slots</p>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer
                      ${selectedSlots.includes(slot) ? 'bg-brand-primary text-white border-brand-primary' : 'border-brand-border text-brand-text hover:border-brand-primary'}`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSubmit}
                disabled={isLoading || selectedDays.length === 0 || selectedSlots.length === 0}
                loading={isLoading}
              >
                Finish <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Staff Profile Form ───────────────────────────────────────────

function StaffProfileForm({ onComplete }: { onComplete: () => void }) {
  const { toast } = useToast();
  const [locationName, setLocationName] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!locationName.trim()) return;
    setIsLoading(true);
    try {
      await api.post('/users/me/staff-profile', {
        locationName,
        district: district || undefined,
        state: state || undefined,
      });
      onComplete();
    } catch {
      toast({
        title: 'Error',
        description: 'Could not save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-border p-6 space-y-5">
      <h2 className="font-heading font-semibold text-xl text-brand-text">Set up your profile</h2>
      <div className="space-y-4">
        {[
          {
            id: 'locationName',
            label: 'Location / Area *',
            value: locationName,
            setter: setLocationName,
            placeholder: 'e.g. Mumbai Central',
          },
          {
            id: 'district',
            label: 'District',
            value: district,
            setter: setDistrict,
            placeholder: 'e.g. Mumbai',
          },
          {
            id: 'state',
            label: 'State',
            value: state,
            setter: setState,
            placeholder: 'e.g. Maharashtra',
          },
        ].map(({ id, label, value, setter, placeholder }) => (
          <div key={id} className="space-y-1.5">
            <label htmlFor={id} className="text-sm font-medium text-brand-text">
              {label}
            </label>
            <input
              id={id}
              type="text"
              value={value}
              onChange={(e) => setter(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 rounded-lg border border-brand-border text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            />
          </div>
        ))}
      </div>
      <Button
        variant="primary"
        fullWidth
        onClick={handleSubmit}
        disabled={!locationName.trim()}
        loading={isLoading}
      >
        Complete Setup <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export default function SetupProfilePage() {
  const router = useRouter();
  const { user, refetch } = useAuth();

  const handleComplete = async () => {
    await refetch();
    const roleRoutes: Record<string, string> = {
      VOLUNTEER: '/volunteer/dashboard',
      COORDINATOR: '/coordinator/dashboard',
      ADMIN: '/admin/dashboard',
      OBSERVER: '/observer/dashboard',
    };
    // user.role is stable — role doesn't change during profile setup
    router.push(roleRoutes[user?.role ?? ''] ?? '/login');
  };

  if (!user) return <div className="text-center text-brand-muted py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-heading font-bold text-2xl text-brand-text">Almost there!</h1>
        <p className="text-brand-muted text-sm mt-1">Set up your profile to get started</p>
      </div>
      {user.role === 'VOLUNTEER' ? (
        <VolunteerProfileForm onComplete={handleComplete} />
      ) : (
        <StaffProfileForm onComplete={handleComplete} />
      )}
    </div>
  );
}
