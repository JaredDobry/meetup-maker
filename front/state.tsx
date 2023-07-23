import { create } from "zustand";

interface TokenState {
  email?: string;
  first_name?: string;
  token?: string;
  setEmail: (e?: string) => void;
  setFirstName: (n?: string) => void;
  setToken: (t?: string) => void;
}

export const useTokenStore = create<TokenState>()((set) => ({
  email: undefined,
  first_name: undefined,
  token: undefined,
  setEmail: (e) => set(() => ({ email: e })),
  setFirstName: (n) => set(() => ({ first_name: n })),
  setToken: (t) => set(() => ({ token: t })),
}));
