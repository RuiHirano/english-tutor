import { create } from 'zustand';
import type { Profile } from '@shared/types';
import { call } from '@/lib/api';

interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  load: () => Promise<void>;
  save: (p: Profile) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  loading: false,
  load: async () => {
    set({ loading: true });
    const profile = await call('db:profile.get', undefined);
    set({ profile, loading: false });
  },
  save: async (p) => {
    const profile = await call('db:profile.upsert', p);
    set({ profile });
  },
}));
