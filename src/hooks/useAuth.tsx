import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type AppRole = 'admin' | 'teacher' | 'student';

export interface Profile {
  id: number;
  fullName: string;
  email: string;
  department: string | null;
  year: number | null;
  section: string | null;
  rollNumber: string | null;
  facultyId: string | null;
  parentEmail: string | null;
  phone: string | null;
  role: AppRole;
}

interface AuthCtx {
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  setUser: (user: Profile) => void;   // ← called right after login/register
  signOut: () => void;
  user: Profile | null;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // On first mount — restore session from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('aura_user');
      if (raw) setProfile(JSON.parse(raw) as Profile);
      else setProfile(null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Called immediately after login/register — sets state AND storage
  const setUser = (user: Profile) => {
    localStorage.setItem('aura_user', JSON.stringify(user));
    setProfile(user);
  };

  const signOut = () => {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
    setProfile(null);
  };

  return (
    <Ctx.Provider value={{ profile, role: profile?.role ?? null, loading, setUser, signOut, user: profile }}>
      {children}
    </Ctx.Provider>
  );
}
