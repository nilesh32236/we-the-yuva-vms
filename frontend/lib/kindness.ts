import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export interface ChallengeView {
  currentDay: number;
  checkedInDays: number[];
  canCheckInToday: boolean;
  canShareStory: boolean;
  daysRemaining: number;
}

export interface MyChallenge {
  challenge: {
    id: string;
    acts: string[];
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'COMPLETED';
    storyId: string | null;
    part2UnlockedAt: string | null;
  };
  view: ChallengeView;
}

export interface KindnessPost {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string | null;
  kindnessDay: number | null;
  isCompletion: boolean;
  createdAt: string;
}

export function useMyChallenge() {
  return useQuery<MyChallenge | null>({
    queryKey: ['kindness-challenge', 'me'],
    queryFn: async () => (await api.get('/kindness-challenge/me')).data,
    retry: false,
  });
}

export function useKindnessPosts(enabled = true) {
  return useQuery<KindnessPost[]>({
    queryKey: ['kindness-challenge', 'me', 'posts'],
    queryFn: async () => (await api.get('/kindness-challenge/me/posts')).data,
    retry: false,
    enabled,
  });
}
