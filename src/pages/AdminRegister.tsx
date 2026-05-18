import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuraLogo } from '@/components/AuraLogo';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function AdminRegister() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminSecret: '',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!form.adminSecret.trim()) {
      toast.error('Admin secret key is required');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register/admin', {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        adminSecret: form.adminSecret,
      });

      // Save token
      localStorage.setItem('aura_token', data.token);

      // Update auth context state immediately
      setUser({
        id: data.id,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        department: null,
        year: null,
        section: null,
        rollNumber: null,
        facultyId: null,
        parentEmail: null,
        phone: null,
      });

      toast.success('Admin account created! Redirecting to dashboard…');
      nav('/admin', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Registration failed. Check your secret key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <AuraLogo />
        </Link>

        <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold leading-tight">Admin Registration</h1>
              <p className="text-xs text-muted-foreground">Requires the institution secret key</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                required
                placeholder="Dr. Rajesh Kumar"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="admin@college.edu"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminSecret">Admin Secret Key</Label>
              <Input
                id="adminSecret"
                type="password"
                required
                placeholder="Enter the institution secret key"
                value={form.adminSecret}
                onChange={e => set('adminSecret', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Set in backend <code className="bg-muted px-1 rounded">application.properties</code> → <code className="bg-muted px-1 rounded">aura.admin.secret</code>
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary shadow-md hover:shadow-glow transition-all h-11 mt-2"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating account…</>
                : <><ShieldCheck className="h-4 w-4 mr-2" />Create Admin Account</>
              }
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
