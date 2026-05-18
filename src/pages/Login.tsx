import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuraLogo } from '@/components/AuraLogo';
import { toast } from 'sonner';
import { Loader2, ShieldAlert, Smartphone, AlertTriangle } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { getDeviceFingerprint } from '@/lib/fingerprint';

interface MismatchModalProps {
  studentName: string;
  currentFp: string;
  onRequestChange: (reason: string) => Promise<void>;
  onContinue: () => void;
  isStudent: boolean;
  submitting: boolean;
}

function DeviceMismatchModal({ studentName, onRequestChange, onContinue, isStudent, submitting }: MismatchModalProps) {
  const [reason, setReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-amber-500/10 border-b border-amber-500/20 rounded-t-2xl p-5 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-base">Device Fingerprint Mismatch</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Security alert for {studentName}</p>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Current device fingerprint differs from your registered device.</strong>
                {' '}You appear to be logging in from a different device or browser.
              </p>
            </div>
          </div>

          {isStudent ? (
            <>
              <p className="text-sm text-muted-foreground">
                For attendance security, your device is verified before marking. Since this device
                doesn't match your registered device, you <strong>cannot mark attendance</strong> until
                an admin approves your device change request.
              </p>
              {!showForm ? (
                <div className="flex flex-col gap-2">
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                    onClick={() => setShowForm(true)}>
                    <Smartphone className="h-4 w-4 mr-2" />Submit Device Change Request
                  </Button>
                  <Button variant="outline" className="w-full" onClick={onContinue}>
                    Continue Anyway (attendance marking will be blocked)
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-semibold">Reason for device change</Label>
                    <Input className="mt-1" value={reason} onChange={e => setReason(e.target.value)}
                      placeholder="e.g. Phone replaced, using college device, etc." autoFocus />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                      disabled={!reason.trim() || submitting} onClick={() => onRequestChange(reason)}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Request'}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Back</Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You are logged in as <strong>staff/admin</strong>. Device verification does not
                restrict your access. You may continue normally.
              </p>
              <Button className="w-full bg-gradient-primary" onClick={onContinue}>Continue to Dashboard</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mismatch, setMismatch] = useState<{ loginData: any; currentFp: string } | null>(null);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const finaliseLogin = (data: any) => {
    setUser({
      id: data.id, email: data.email, fullName: data.fullName, role: data.role,
      department: data.department ?? null, year: data.year ?? null, section: data.section ?? null,
      rollNumber: data.rollNumber ?? null, facultyId: data.facultyId ?? null,
      parentEmail: data.parentEmail ?? null, phone: data.phone ?? null,
    });
    toast.success(`Welcome back, ${data.fullName}!`);
    nav(`/${data.role}`, { replace: true });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('aura_token', data.token);

      // Only check fingerprint for students who have a registered device
      if (data.role === 'student' && data.deviceFingerprint) {
        try {
          const currentFp = await getDeviceFingerprint();
          if (currentFp !== data.deviceFingerprint) {
            setMismatch({ loginData: data, currentFp });
            return; // Stop here — show modal
          }
        } catch { /* fingerprint gen failed — let through */ }
      }
      finaliseLogin(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChange = async (reason: string) => {
    if (!mismatch) return;
    setSubmittingRequest(true);
    try {
      await api.post('/student/device/request-change', { fingerprint: mismatch.currentFp, reason });
      toast.success('Device change request submitted! Admin will review it soon.');
      setMismatch(null);
      finaliseLogin(mismatch.loginData);
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Failed to submit request';
      if (msg.includes('already have a pending')) {
        toast.info('You already have a pending device change request.');
        setMismatch(null);
        finaliseLogin(mismatch.loginData);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleContinue = () => {
    if (!mismatch) return;
    setMismatch(null);
    finaliseLogin(mismatch.loginData);
  };

  return (
    <>
      {mismatch && (
        <DeviceMismatchModal
          studentName={mismatch.loginData.fullName}
          currentFp={mismatch.currentFp}
          onRequestChange={handleRequestChange}
          onContinue={handleContinue}
          isStudent={mismatch.loginData.role === 'student'}
          submitting={submittingRequest}
        />
      )}
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Link to="/" className="flex justify-center mb-8"><AuraLogo /></Link>
          <div className="bg-card border border-border rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-sm text-muted-foreground mb-6">Sign in with the credentials provided by your admin.</p>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required autoComplete="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="you@college.edu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required autoComplete="current-password" value={password}
                  onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
              </div>
              <Button type="submit" disabled={loading}
                className="w-full bg-gradient-primary shadow-md hover:shadow-glow transition-all h-11">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
              </Button>
            </form>
            <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
              <p>Students &amp; teachers — your credentials are created by your admin.</p>
              <p className="mt-3">Are you an admin?{' '}
                <Link to="/register/admin" className="text-primary font-semibold hover:underline">Create admin account</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
