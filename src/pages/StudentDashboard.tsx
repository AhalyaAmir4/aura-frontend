import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { BookOpen, History, QrCode, ShieldCheck, Sparkles, Camera, Send, HelpCircle, CalendarClock, UserCheck, Smartphone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import { QrScanner } from '@/components/QrScanner';
import api from '@/lib/api';

function Ring({ pct, size = 120, color = 'hsl(var(--primary))' }: { pct: number; size?: number; color?: string }) {
  const r = (size - 16) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="10" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-extrabold">{Math.round(pct)}%</div>
      </div>
    </div>
  );
}

function statusOf(pct: number) {
  if (pct >= 75) return { label: 'Safe', color: 'bg-success text-success-foreground', ring: 'hsl(var(--success))' };
  if (pct >= 65) return { label: 'At Risk', color: 'bg-warning text-warning-foreground', ring: 'hsl(var(--warning))' };
  return { label: 'Critical', color: 'bg-destructive text-destructive-foreground', ring: 'hsl(var(--destructive))' };
}

export default function StudentDashboard() {
  const loc = useLocation();
  const path = loc.pathname.split('/')[2] ?? '';
  return (
    <>
      <DashboardLayout>
        {path === '' ? <Overview /> :
         path === 'mark' ? <MarkAttendance /> :
         path === 'teachers' ? <MyTeachers /> :
         path === 'subjects' ? <SubjectStats /> :
         path === 'device' ? <MyDevice /> :
         path === 'history' ? <HistoryTab /> : <Overview />}
      </DashboardLayout>
      <ChatbotWidget />
    </>
  );
}

function Overview() {
  const [stats, setStats] = useState({ present: 0, total: 0, semester: null as any });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/student/overview').then(({ data }) => { setStats(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const hasData = stats.total > 0;
  const pct = hasData ? (stats.present / stats.total) * 100 : 0;
  const st = hasData ? statusOf(pct) : { label: 'Not started', color: 'bg-muted text-muted-foreground', ring: 'hsl(var(--muted-foreground))' };
  const need75 = Math.max(0, Math.ceil((0.75 * stats.total - stats.present) / 0.25));
  const canBunk = pct >= 75 ? Math.floor((stats.present - 0.75 * stats.total) / 0.75) : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your attendance and stay on the safe side.</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Semester Progress</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">{stats.semester?.name ?? 'No active semester'}</p>
              </div>
              <Badge className={st.color}>{st.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? <div className="h-40 animate-pulse bg-muted rounded-xl" /> :
             !hasData ? (
              <div className="text-center py-8">
                <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-60" />
                <h3 className="font-bold text-lg">No classes yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">Your attendance will appear once your first class begins.</p>
                <a href="/student/mark"><Button className="mt-4 bg-gradient-primary"><QrCode className="h-4 w-4 mr-2" />Check for live class</Button></a>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <Ring pct={pct} size={160} color={st.ring} />
                  <div className="flex-1 grid grid-cols-3 gap-3 w-full">
                    {[['Present', stats.present],['Total', stats.total],['Absent', Math.max(0,stats.total-stats.present)]].map(([l,v])=>(
                      <div key={l} className="p-4 bg-secondary rounded-xl text-center">
                        <div className="text-2xl font-extrabold">{v}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{l}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-6 p-4 bg-accent rounded-xl flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-sm">
                    {pct >= 75
                      ? <>You're safe — you can miss <b>{canBunk}</b> more class{canBunk !== 1 ? 'es' : ''} and still stay ≥75%.</>
                      : <>You need to attend <b>{need75}</b> more class{need75 !== 1 ? 'es' : ''} to reach 75%.</>}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <a href="/student/mark"><Button className="w-full justify-start bg-gradient-primary"><QrCode className="h-4 w-4 mr-2" />Mark Attendance</Button></a>
            <a href="/student/teachers"><Button variant="outline" className="w-full justify-start"><UserCheck className="h-4 w-4 mr-2" />My Teachers</Button></a>
            <a href="/student/subjects"><Button variant="outline" className="w-full justify-start"><BookOpen className="h-4 w-4 mr-2" />View Subjects</Button></a>
            <a href="/student/history"><Button variant="outline" className="w-full justify-start"><History className="h-4 w-4 mr-2" />History</Button></a>
            <a href="/student/device"><Button variant="outline" className="w-full justify-start"><Smartphone className="h-4 w-4 mr-2" />My Device</Button></a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MyTeachers() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/student/teachers').then(({ data }) => { setRows(data); setLoading(false); }).catch(() => setLoading(false));
  }, []);
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Teachers</h1>
        <p className="text-muted-foreground text-sm mt-1">Faculty for <b>{profile?.department} Y{profile?.year} Sec {profile?.section}</b></p>
      </div>
      {loading ? <div className="grid sm:grid-cols-2 gap-3">{[1,2,3,4].map(i=><Card key={i}><CardContent className="p-5 h-24 animate-pulse bg-muted/50"/></Card>)}</div>
      : rows.length === 0
        ? <Card><CardContent className="p-12 text-center text-sm text-muted-foreground"><UserCheck className="h-10 w-10 mx-auto mb-3 opacity-40"/>No teachers allocated yet.</CardContent></Card>
        : <div className="grid sm:grid-cols-2 gap-3">
            {rows.map((r:any)=>(
              <Card key={r.id} className="shadow-soft hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0">{r.teacherName?.[0]??'?'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold truncate">{r.teacherName}</div>
                      <div className="text-xs text-muted-foreground">{r.facultyId||'—'}</div>
                      <Badge variant="secondary" className="text-xs mt-2">{r.subjectName}</Badge>
                      <div className="text-[10px] text-muted-foreground font-mono mt-1">{r.subjectCode}</div>
                      {r.teacherEmail && <div className="text-[11px] text-muted-foreground truncate mt-1">📧 {r.teacherEmail}</div>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>}
    </div>
  );
}

function MarkAttendance() {
  const [busy, setBusy] = useState(false);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState('');
  const [showCodeBox, setShowCodeBox] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const pollRef = useRef<any>(null);

  const loadActive = useCallback(async () => {
    try {
      const { data } = await api.get('/student/active-session');
      if (!data?.id) { setActiveSession(null); return; }
      setActiveSession(data);
      setAlreadyMarked(data.alreadyMarked ?? false);
    } catch { setActiveSession(null); }
  }, []);

  useEffect(() => {
    loadActive();
    pollRef.current = setInterval(loadActive, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const markWith = async (payload: { qrToken?: string; shortCode?: string }) => {
    setBusy(true);
    try {
      const fp = await getDeviceFingerprint();
      await api.post('/student/mark-attendance', { ...payload, fingerprint: fp });
      toast.success('Attendance marked! ✅');
      setCode(''); setScanning(false); setAlreadyMarked(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Failed to mark attendance');
    } finally { setBusy(false); }
  };

  const onScan = (text: string) => {
    // New format: sessionId.secret8.epochSeconds (e.g. "1.abc12345.1715672")
    // Also accept old AURA| format for backward compatibility
    const isNewFormat = /^\d+\.[a-zA-Z0-9-]+\.\d+$/.test(text);
    const isOldFormat = text.startsWith('AURA|');
    if (!isNewFormat && !isOldFormat) { toast.error('Not a valid AURA QR code'); return; }
    markWith({ qrToken: text });
  };

  const submitCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 4) { toast.error('Enter the 4-digit code shown by your teacher'); return; }
    markWith({ shortCode: code });
  };

  if (!activeSession) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Mark Attendance</h1>
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <QrCode className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">No live class right now</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              When your teacher starts a session, this page will update automatically.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-success animate-ping" />
                <span className="absolute inset-0 rounded-full bg-success" />
              </span>
              Checking every 5 seconds
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (alreadyMarked) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Mark Attendance</h1>
        <Card className="shadow-soft border-success/30 bg-success/5">
          <CardContent className="p-10 text-center">
            <div className="text-5xl mb-3">✅</div>
            <div className="text-xl font-bold text-success-foreground">You're marked present!</div>
            <p className="text-sm text-muted-foreground mt-2">for {activeSession.subjectName} ({activeSession.subjectCode})</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Mark Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">Live class: <b>{activeSession.subjectName}</b> ({activeSession.subjectCode})</p>
      </div>

      <Card className="shadow-soft">
        <CardContent className="p-8 space-y-5">
          {/* QR Scan */}
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary mb-4 shadow-glow">
              <Camera className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold">Scan QR Code</h2>
            <p className="text-xs text-muted-foreground mt-1">Point your camera at the QR code on the projector/teacher's screen</p>
          </div>
          <Button onClick={() => setScanning(true)} disabled={busy} className="w-full h-14 bg-gradient-primary text-base">
            <Camera className="h-5 w-5 mr-2" />{busy ? 'Verifying…' : 'Open Camera Scanner'}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-card px-3 text-muted-foreground">OR enter short code</span></div>
          </div>

          {/* Short code entry — student manually types what they see on projector */}
          {showCodeBox ? (
            <form onSubmit={submitCode} className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">Type the 4-digit code shown on your teacher's screen</p>
              <Input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="0000"
                className="text-center text-3xl font-extrabold h-16 tracking-[0.5em]"
                maxLength={4}
                autoFocus
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={busy || code.length !== 4} className="flex-1 bg-gradient-primary">
                  {busy ? 'Verifying…' : 'Submit Code'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowCodeBox(false); setCode(''); }}>Cancel</Button>
              </div>
            </form>
          ) : (
            <Button onClick={() => setShowCodeBox(true)} variant="outline" className="w-full">
              <HelpCircle className="h-4 w-4 mr-2" />Enter 4-digit short code instead
            </Button>
          )}

          <p className="text-[11px] text-center text-muted-foreground">
            Your device fingerprint is verified to prevent proxy attendance.
          </p>
        </CardContent>
      </Card>
      {scanning && <QrScanner onResult={onScan} onClose={() => setScanning(false)} />}
    </div>
  );
}

function SubjectStats() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.get('/student/subject-stats').then(({ data }) => setRows(data)).catch(() => {}); }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Subject-wise Stats</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No data yet.</CardContent></Card>}
        {rows.map((s:any) => {
          const st = statusOf(s.pct);
          return (
            <Card key={s.id} className="shadow-soft hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="min-w-0">
                    <div className="font-bold truncate">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.code}</div>
                  </div>
                  <Badge className={st.color}>{st.label}</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Ring pct={s.pct} size={90} color={st.ring} />
                  <div className="text-sm">
                    <div><b>{s.present}</b> / {s.total} classes</div>
                    <div className="text-xs text-muted-foreground mt-1">{s.credits} credits</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function HistoryTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.get('/student/history').then(({ data }) => setRows(data)).catch(() => {}); }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Attendance History</h1>
      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Subject</th><th className="text-left p-3">Status</th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">No records yet.</td></tr>}
              {rows.map((r:any,i:number)=>(
                <tr key={i} className="border-t border-border">
                  <td className="p-3">{new Date(r.markedAt).toLocaleString()}</td>
                  <td className="p-3">{r.subjectName} <span className="text-xs text-muted-foreground">({r.subjectCode})</span></td>
                  <td className="p-3">
                    <Badge className={r.status==='PRESENT'?'bg-success text-success-foreground':'bg-destructive text-destructive-foreground'}>{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function MyDevice() {
  const [enrolled, setEnrolled] = useState('');
  const [currentFp, setCurrentFp] = useState('');
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const fp = await getDeviceFingerprint();
      setCurrentFp(fp);
      const { data: dev } = await api.get('/student/device');
      setEnrolled(dev.enrolled ?? '');
      setHasPendingRequest(dev.hasPendingRequest ?? false);
      const { data: reqs } = await api.get('/student/device/requests');
      setMyRequests(reqs);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const enrollFirst = async () => {
    setBusy(true);
    try {
      await api.put('/student/device/enroll', { fingerprint: currentFp });
      toast.success('Device enrolled!');
      load();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
    finally { setBusy(false); }
  };

  const submitRequest = async () => {
    if (!reason.trim()) { toast.error('Please give a reason for the device change'); return; }
    setBusy(true);
    try {
      await api.post('/student/device/request-change', { fingerprint: currentFp, reason });
      toast.success('Request submitted! Admin will review it.');
      setReason('');
      load();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
    finally { setBusy(false); }
  };

  const matches = enrolled && currentFp && enrolled === currentFp;
  const statusColor = (s: string) =>
    s === 'APPROVED' ? 'bg-success text-success-foreground' :
    s === 'DECLINED' ? 'bg-destructive text-destructive-foreground' :
    'bg-warning text-warning-foreground';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">My Device</h1>
        <p className="text-muted-foreground text-sm mt-1">Your attendance is locked to one device to prevent proxies.</p>
      </div>

      {/* Status card */}
      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Device Status</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs space-y-2 bg-secondary p-3 rounded-lg">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">Enrolled device</span>
              <span className="font-mono truncate max-w-[55%]">{enrolled ? enrolled.slice(0,20)+'…' : '— not enrolled —'}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground">This device</span>
              <span className="font-mono truncate max-w-[55%]">{currentFp ? currentFp.slice(0,20)+'…' : '…'}</span>
            </div>
          </div>

          {!enrolled ? (
            <div className="p-4 rounded-xl bg-accent space-y-3">
              <p className="text-sm">No device enrolled yet. Enroll <b>this device</b> now to start marking attendance.</p>
              <Button onClick={enrollFirst} disabled={busy} className="w-full bg-gradient-primary">
                <Smartphone className="h-4 w-4 mr-2" />{busy ? 'Enrolling…' : 'Enroll This Device'}
              </Button>
            </div>
          ) : matches ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/30">
              <span className="text-success-foreground text-sm font-semibold">✅ This is your enrolled device. You can mark attendance.</span>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 space-y-2">
              <p className="text-sm font-semibold text-destructive">⚠️ This is NOT your enrolled device.</p>
              <p className="text-xs text-muted-foreground">You cannot mark attendance from this device. Use your registered device, or submit a change request below.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Device change request — show whenever device is enrolled (even matched, student may want to change proactively) */}
      {enrolled && (
        <Card className="shadow-soft">
          <CardHeader><CardTitle className="text-base">Request Device Change</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {hasPendingRequest ? (
              <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl text-sm">
                ⏳ <b>You have a pending request.</b> Please wait for your admin to approve or decline it before submitting a new one.
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">This will register <b>the current device</b> as your new device. Admin must approve before it takes effect.</p>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Reason <span className="text-destructive">*</span></label>
                  <Textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. My old phone broke, I got a new phone, etc."
                    rows={3}
                  />
                </div>
                <Button onClick={submitRequest} disabled={busy || !reason.trim()} className="w-full bg-gradient-primary">
                  <Send className="h-4 w-4 mr-2" />{busy ? 'Submitting…' : 'Submit Request to Admin'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Request history */}
      {myRequests.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">My Requests</CardTitle>
              <Button size="sm" variant="ghost" onClick={load}><RefreshCw className="h-3.5 w-3.5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {myRequests.map((r:any) => (
              <div key={r.id} className="p-3 rounded-xl border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                  <Badge className={statusColor(r.status)}>{r.status}</Badge>
                </div>
                {r.reason && <p className="text-xs"><b>Your reason:</b> {r.reason}</p>}
                {r.adminNote && <p className="text-xs"><b>Admin note:</b> {r.adminNote}</p>}
                {r.resolvedAt && <p className="text-xs text-muted-foreground">Resolved: {new Date(r.resolvedAt).toLocaleString()}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}