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

export function useMyChallenge() {
  return useQuery<MyChallenge | null>({
    queryKey: ['kindness-challenge', 'me'],
    queryFn: async () => (await api.get('/kindness-challenge/me')).data,
    retry: false,
  });
}
