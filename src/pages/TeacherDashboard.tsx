import { useEffect, useRef, useState, useCallback } from 'react';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'react-router-dom';
import { Play, Square, RefreshCw, CheckCircle2, XCircle, Eye, EyeOff, UserCheck, Users, ArrowLeft, Clock, BookOpen, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import api from '@/lib/api';

const DEPTS = ['ECE','CSE','IT','AIDS','MECH','CIVIL','EEE'];
const YEARS = ['1','2','3','4'];
const SECTIONS = ['A','B','C','D'];

export default function TeacherDashboard() {
  const path = useLocation().pathname.split('/')[2] ?? '';
  return (
    <>
      <DashboardLayout>
        {path === ''        ? <LiveSession />   :
         path === 'heatmap' ? <Heatmap />       :
         path === 'feed'    ? <LiveFeed />      :
         path === 'history' ? <SessionHistory />:
         path === 'students'? <StudentsTab />   : <LiveSession />}
      </DashboardLayout>
      <ChatbotWidget />
    </>
  );
}

/* ══════════════ LIVE SESSION ══════════════ */
function LiveSession() {
  const [allSubjects, setAllSubjects]   = useState<any[]>([]);
  const [subjectId, setSubjectId]       = useState('');
  const [dept, setDept]                 = useState('');
  const [year, setYear]                 = useState('');
  const [section, setSection]           = useState('');
  const [session, setSession]           = useState<any>(null);
  const [qrUrl, setQrUrl]               = useState('');
  const [qrCountdown, setQrCountdown]   = useState(60);
  const [roster, setRoster]             = useState<any[]>([]);
  const [presentCount, setPresentCount] = useState(0);
  const [revealedCode, setRevealedCode] = useState<{code:string;expiresAt:number}|null>(null);
  const [revealCountdown, setRevealCountdown] = useState(0);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [manualBusy, setManualBusy]     = useState<number|null>(null);
  const [odDialog, setOdDialog]         = useState<{id:number;name:string}|null>(null);
  const [odReason, setOdReason]         = useState('');
  const pollRef = useRef<any>(null);

  const issueQr = useCallback(async (sid: number) => {
    try {
      const { data } = await api.get(`/teacher/sessions/${sid}/qr`);
      if (data.token) {
        const url = await QRCode.toDataURL(data.token, { width: 300, margin: 1, color: { dark: '#312e81', light: '#ffffff' } });
        setQrUrl(url);
      }
    } catch {}
  }, []);

  const loadRoster = useCallback(async (sid: number) => {
    try {
      const { data } = await api.get(`/teacher/sessions/${sid}/roster`);
      setRoster(data.roster ?? []);
      setPresentCount(data.presentCount ?? 0);
    } catch {}
  }, []);

  useEffect(() => {
    // Load all subjects for free pick
    api.get('/teacher/subjects').then(({ data }) => setAllSubjects(data)).catch(() => {});
    // Check active session
    api.get('/teacher/allocations').then(({ data }) => {
      if (data.activeSession) {
        const s = data.activeSession;
        setSession(s);
        setSubjectId(String(s.subjectId ?? ''));
        setSection(s.section ?? '');
        setDept(s.department ?? '');
        setYear(String(s.year ?? ''));
        if (s.shortCodeRevealed && s.shortCode && s.shortCodeExpiresAt) {
          const exp = new Date(s.shortCodeExpiresAt).getTime();
          if (exp > Date.now()) setRevealedCode({ code: s.shortCode, expiresAt: exp });
        }
      }
      setBootstrapping(false);
    }).catch(() => setBootstrapping(false));
  }, []);

  useEffect(() => {
    if (!session) return;
    issueQr(session.id); setQrCountdown(60);
    const t = setInterval(() => setQrCountdown(c => { if(c<=1){issueQr(session.id);return 60;} return c-1; }), 1000);
    return () => clearInterval(t);
  }, [session?.id]);

  useEffect(() => {
    if (!session) { setRoster([]); setPresentCount(0); return; }
    loadRoster(session.id);
    pollRef.current = setInterval(() => loadRoster(session.id), 4000);
    return () => clearInterval(pollRef.current);
  }, [session?.id]);

  useEffect(() => {
    if (!revealedCode) { setRevealCountdown(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.ceil((revealedCode.expiresAt - Date.now()) / 1000));
      setRevealCountdown(left);
      if (left === 0) setRevealedCode(null);
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [revealedCode]);

  const startSession = async () => {
    if (!subjectId || !section || !dept || !year) { toast.error('Select subject, dept, year and section'); return; }
    try {
      const { data } = await api.post('/teacher/sessions/start', {
        subjectId: Number(subjectId), section, department: dept, year: Number(year)
      });
      setSession(data); toast.success('Session started!');
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };

  const endSession = async () => {
    if (!session) return;
    try {
      await api.put(`/teacher/sessions/${session.id}/end`);
      setSession(null); setQrUrl(''); setRevealedCode(null); setRoster([]); setPresentCount(0);
      toast.success('Session ended — absentees auto-marked');
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };

  const revealCode = async () => {
  try {
    const { data } = await api.post(`/teacher/sessions/${session.id}/reveal-code`);

    console.log("RESPONSE DATA:", data);

    setRevealedCode({
      code: data.code,
      expiresAt: new Date(data.expiresAt).getTime()
    });

  } catch (e: any) {
    console.log("ERROR:", e);

    toast.error(e.response?.data?.error ?? 'Failed');
  }
};

  const hideCode = async () => {
    try { await api.post(`/teacher/sessions/${session.id}/hide-code`); setRevealedCode(null); } catch {}
  };

  const manualMark = async (studentId: number, name: string) => {
    if (!session) return;
    setManualBusy(studentId);
    try {
      await api.post(`/teacher/sessions/${session.id}/mark/${studentId}`);
      toast.success(`${name} marked present ✅`); loadRoster(session.id);
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
    finally { setManualBusy(null); }
  };

  const manualUnmark = async (studentId: number) => {
    if (!session) return;
    setManualBusy(studentId);
    try {
      await api.post(`/teacher/sessions/${session.id}/unmark/${studentId}`);
      toast.success('Undo done'); loadRoster(session.id);
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
    finally { setManualBusy(null); }
  };

  const flagSuspicious = async (studentId: number, name: string) => {
    const reason = window.prompt(`Flag "${name}" as suspicious\nEnter reason:`);
    if (!reason || !reason.trim()) return;
    try {
      await api.post(`/teacher/sessions/${session.id}/flag/${studentId}`, { reason: reason.trim() });
      toast.success(`${name} flagged as suspicious`);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Could not flag student');
    }
  };

  const grantOd = async () => {
    if (!odDialog || !session) return;
    if (!odReason.trim()) { toast.error('Enter OD reason'); return; }
    try {
      await api.post(`/teacher/sessions/${session.id}/od/${odDialog.id}`, { reason: odReason });
      toast.success(`OD granted to ${odDialog.name}`);
      setOdDialog(null); setOdReason(''); loadRoster(session.id);
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };

  const filteredSubs = allSubjects.filter(s =>
    (!dept || s.department === dept) && (!year || String(s.year) === year)
  );

  if (bootstrapping) return <div className="max-w-2xl"><Card><CardContent className="p-12 text-center text-muted-foreground">Loading…</CardContent></Card></div>;

  if (!session) return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Start Session</h1>
        <p className="text-sm text-muted-foreground mt-1">You can take class for any department, year, and section.</p>
      </div>
      <Card className="shadow-soft">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Department</label>
              <Select value={dept} onValueChange={v=>{ setDept(v); setSubjectId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                <SelectContent>{DEPTS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Year</label>
              <Select value={year} onValueChange={v=>{ setYear(v); setSubjectId(''); }}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>{YEARS.map(y=><SelectItem key={y} value={y}>Year {y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Subject</label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={!dept||!year}>
              <SelectTrigger><SelectValue placeholder={!dept||!year ? 'Select dept & year first' : 'Choose subject'} /></SelectTrigger>
              <SelectContent>
                {filteredSubs.length === 0 && <div className="p-3 text-xs text-muted-foreground">No subjects found</div>}
                {filteredSubs.map((s:any)=><SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold">Section</label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>{SECTIONS.map(s=><SelectItem key={s} value={s}>Section {s}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <Button onClick={startSession} disabled={!subjectId||!section||!dept||!year} className="w-full h-12 bg-gradient-primary">
            <Play className="h-4 w-4 mr-2"/>Start Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative h-2.5 w-2.5"><span className="absolute inset-0 rounded-full bg-success animate-ping"/><span className="absolute inset-0 rounded-full bg-success"/></span>
            <span className="text-xs font-bold text-success uppercase tracking-wide">Live</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{session.subjectName}</h1>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-mono">{session.subjectCode}</Badge>
            <Badge variant="secondary">{session.department}</Badge>
            <Badge variant="secondary">Year {session.year}</Badge>
            <Badge variant="secondary">Sec {session.section}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-base px-3 py-1.5"><Users className="h-3.5 w-3.5 mr-1.5"/>{presentCount}/{roster.length}</Badge>
          <Button variant="destructive" onClick={endSession}><Square className="h-4 w-4 mr-2"/>End</Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* QR */}
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader><CardTitle className="text-base">QR Code — rotates every 60s</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative">
              {qrUrl ? <img src={qrUrl} alt="QR" className="rounded-2xl shadow-md max-w-[280px]"/> : <div className="h-64 w-64 bg-muted animate-pulse rounded-2xl"/>}
              <div className="absolute -top-3 -right-3 bg-card border-2 border-primary rounded-full h-14 w-14 flex flex-col items-center justify-center shadow-md">
                <div className="text-lg font-extrabold text-primary">{qrCountdown}</div>
                <div className="text-[9px] text-muted-foreground">SEC</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Short code */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Short Code</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Students enter this manually. Only show it when you want.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {revealedCode ? (
              <div className="text-center p-6 bg-gradient-primary rounded-2xl">
                <div className="text-xs text-primary-foreground/80 font-bold uppercase tracking-wider mb-2">Active — show students</div>
                <div className="text-6xl font-extrabold text-primary-foreground tracking-[0.4em]">{revealedCode.code}</div>
                <div className="text-sm text-primary-foreground/80 mt-3">Hides in <b>{revealCountdown}s</b></div>
              </div>
            ) : (
              <div className="text-center p-6 bg-muted rounded-2xl">
                <div className="text-5xl font-extrabold text-muted-foreground/30 tracking-[0.4em]">----</div>
                <div className="text-xs text-muted-foreground mt-2">Hidden from students</div>
              </div>
            )}
            <div className="flex gap-2">
              {!revealedCode
                ? <Button onClick={revealCode} className="flex-1 bg-gradient-primary"><Eye className="h-4 w-4 mr-2"/>Reveal (30s)</Button>
                : <>
                    <Button onClick={revealCode} variant="outline" className="flex-1"><RefreshCw className="h-4 w-4 mr-2"/>New</Button>
                    <Button onClick={hideCode} variant="destructive" className="flex-1"><EyeOff className="h-4 w-4 mr-2"/>Hide</Button>
                  </>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roster */}
      <Card className="shadow-soft">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Class Roster</CardTitle>
            <div className="flex gap-2">
              <Badge className="bg-success text-success-foreground">Present {presentCount}</Badge>
              <Badge variant="destructive">Absent {roster.length - presentCount}</Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Use <b>Mark</b> for students without phone. Use <b>OD</b> for students on official duty.</p>
        </CardHeader>
        <CardContent>
          {roster.length === 0
            ? <div className="text-center py-8 text-sm text-muted-foreground">No students found in this section.</div>
            : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[500px] overflow-y-auto">
                {roster.map((s:any) => {
                  const loading = manualBusy === s.id;
                  return (
                    <div key={s.id} className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                      s.od ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800'
                           : s.present ? 'bg-success/10 border-success/30' : 'bg-destructive/5 border-destructive/20'}`}>
                      {s.od ? <BookOpen className="h-4 w-4 text-blue-500 shrink-0"/>
                             : s.present ? <CheckCircle2 className="h-4 w-4 text-success shrink-0"/>
                                         : <XCircle className="h-4 w-4 text-destructive shrink-0"/>}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{s.fullName}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{s.rollNumber}</div>
                        {s.od && <div className="text-[10px] text-blue-500 font-semibold">📋 OD</div>}
                        {s.manuallyMarked && !s.od && <div className="text-[10px] text-primary font-semibold">👨‍🏫 Manual</div>}
                      </div>
                      {!s.present && !s.od && (
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button size="sm" className="text-[10px] h-6 px-2 bg-gradient-primary" disabled={loading}
                            onClick={() => manualMark(s.id, s.fullName)}>
                            {loading ? '…' : <><UserCheck className="h-3 w-3 mr-0.5"/>Mark</>}
                          </Button>
                          <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 text-blue-600 border-blue-300"
                            disabled={loading} onClick={() => { setOdDialog({id:s.id,name:s.fullName}); setOdReason(''); }}>
                            OD
                          </Button>
                        </div>
                      )}
                      {s.present && s.manuallyMarked && !s.od && (
                        <Button size="sm" variant="ghost" className="text-[10px] h-6 px-2 text-destructive shrink-0"
                          disabled={loading} onClick={() => manualUnmark(s.id)}>Undo</Button>
                      )}
                      {s.present && !s.od && (
                        <Button size="sm" variant="ghost"
                          className="text-[10px] h-6 px-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 shrink-0"
                          disabled={loading}
                          onClick={() => flagSuspicious(s.id, s.fullName)}
                          title="Flag as suspicious activity">
                          🚩
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>}
        </CardContent>
      </Card>

      {/* OD Dialog */}
      {odDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOdDialog(null)}/>
          <Card className="relative w-full max-w-sm shadow-xl">
            <CardHeader><CardTitle className="text-base">Grant OD — {odDialog.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">OD (On Duty) counts the student as present but marked for official duty.</p>
              <Input value={odReason} onChange={e=>setOdReason(e.target.value)} placeholder="Reason (e.g. Sports meet, Symposium, NSS camp)" autoFocus/>
              <div className="flex gap-2">
                <Button className="flex-1 bg-gradient-primary" onClick={grantOd} disabled={!odReason.trim()}>Grant OD</Button>
                <Button variant="outline" className="flex-1" onClick={() => setOdDialog(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ══════════════ SESSION HISTORY ══════════════ */
function SessionHistory() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState('PRESENT');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);

  useEffect(() => {
    api.get('/teacher/sessions/history').then(({ data }) => setSessions(data)).catch(() => {});
  }, []);

  const openDetail = async (s: any) => {
    setSelected(s); setDetail(null); setLoadingDetail(true); setEmailResult(null);
    try {
      const { data } = await api.get(`/teacher/sessions/${s.id}/detail`);
      setDetail(data);
    } catch { toast.error('Failed to load session detail'); }
    finally { setLoadingDetail(false); }
  };

  const sendAbsenceEmails = async () => {
    if (!selected) return;
    setSendingEmail(true); setEmailResult(null);
    try {
      const { data } = await api.post(`/teacher/sessions/${selected.id}/send-absence-emails`);
      setEmailResult(data);
      toast.success(data.message ?? 'Absence emails sent!');
    } catch (e: any) {
      toast.error(e.response?.data?.error ?? 'Failed to send emails');
    } finally { setSendingEmail(false); }
  };

  if (selected) {
    const filtered = detail?.roster?.filter((r: any) =>
      filterStatus === 'ALL' || r.status === filterStatus) ?? [];
    const sum = detail?.summary;

    return (
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setSelected(null); setDetail(null); setEmailResult(null); }}>
            <ArrowLeft className="h-4 w-4 mr-2"/>Back
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{selected.subjectName}</h1>
            <p className="text-sm text-muted-foreground">{selected.department} · Year {selected.year} · Sec {selected.section} · {new Date(selected.startedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Summary */}
        {sum && (
          <div className="grid grid-cols-4 gap-3">
            {[['Total', sum.total, 'bg-secondary'],['Present', sum.present, 'bg-success/15'],['Absent', sum.absent, 'bg-destructive/15'],['OD', sum.od, 'bg-blue-100 dark:bg-blue-950/30']].map(([l,v,c])=>(
              <div key={l as string} className={`${c} rounded-xl p-4 text-center`}>
                <div className="text-3xl font-extrabold">{v}</div>
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mt-1">{l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Send Absence Email button — only if session is ENDED */}
        {selected.status === 'ENDED' && (
          <Card className="shadow-soft border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-semibold text-sm">Notify Parents of Absent Students</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sends an email to parent addresses of all students marked ABSENT in this session.
                  </p>
                  {emailResult && (
                    <p className="text-xs mt-1.5 text-success font-semibold">
                      ✅ {emailResult.sent} email(s) sent · {emailResult.skipped} present/OD skipped
                      {emailResult.failed > 0 && ` · ${emailResult.failed} failed (no parent email)`}
                    </p>
                  )}
                </div>
                <Button
                  onClick={sendAbsenceEmails}
                  disabled={sendingEmail}
                  className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                >
                  {sendingEmail
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin"/>Sending…</>
                    : <><Mail className="h-4 w-4 mr-2"/>Send Absence Emails</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter + table */}
        <Card className="shadow-soft overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base">Attendance Roster</CardTitle>
              <div className="flex gap-2">
                {['ALL','PRESENT','ABSENT','OD'].map(f=>(
                  <Button key={f} size="sm" variant={filterStatus===f?'default':'outline'}
                    className={filterStatus===f?'bg-gradient-primary':''}
                    onClick={()=>setFilterStatus(f)}>{f}</Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            {loadingDetail
              ? <div className="p-12 text-center text-muted-foreground text-sm">Loading…</div>
              : <table className="w-full text-sm">
                  <thead className="bg-secondary text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left p-3">Roll</th>
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Note</th>
                      <th className="text-left p-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No records.</td></tr>}
                    {filtered.map((r:any)=>(
                      <tr key={r.id} className="border-t border-border">
                        <td className="p-3 font-mono">{r.rollNumber||'—'}</td>
                        <td className="p-3 font-semibold">{r.fullName}</td>
                        <td className="p-3">
                          <Badge className={
                            r.status==='PRESENT' ? 'bg-success text-success-foreground' :
                            r.status==='OD'      ? 'bg-blue-500 text-white' :
                            'bg-destructive text-destructive-foreground'}>
                            {r.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {r.od ? `OD: ${r.odReason}` : r.manual ? 'Manual by teacher' : ''}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {r.markedAt ? new Date(r.markedAt).toLocaleTimeString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Session History</h1>
        <p className="text-sm text-muted-foreground mt-1">Click any session to see the full attendance roster.</p>
      </div>
      {sessions.length === 0 && <Card><CardContent className="p-12 text-center text-muted-foreground text-sm">No sessions yet.</CardContent></Card>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((s:any)=>(
          <Card key={s.id} className="shadow-soft hover:shadow-md transition-shadow cursor-pointer" onClick={()=>openDetail(s)}>
            <CardContent className="p-5">
              <div className="font-bold">{s.subjectName}</div>
              <div className="text-xs text-muted-foreground">{s.subjectCode} · {s.department} · Y{s.year} · Sec {s.section}</div>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5"/>
                {new Date(s.startedAt).toLocaleString()}
              </div>
              <div className="flex gap-2 mt-3">
                <Badge variant={s.status==='ACTIVE'?'default':'secondary'}>{s.status}</Badge>
                <Badge variant="outline" className="text-xs">View Roster →</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ══════════════ HEATMAP ══════════════ */
function Heatmap() {
  const [session, setSession] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/teacher/allocations');
        if (!data.activeSession) { setSession(null); return; }
        setSession(data.activeSession);
        const { data: r } = await api.get(`/teacher/sessions/${data.activeSession.id}/roster`);
        setRoster(r.roster ?? []);
      } catch {}
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);
  if (!session) return (
    <div className="space-y-4"><h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Live Heatmap</h1>
    <Card><CardContent className="p-12 text-center text-sm text-muted-foreground">Start a session to see the heatmap.</CardContent></Card></div>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Live Heatmap</h1>
      <div className="flex gap-3 flex-wrap text-xs">
        <Badge className="bg-success text-success-foreground">Present {roster.filter(s=>s.present).length}</Badge>
        <Badge variant="destructive">Absent {roster.filter(s=>!s.present).length}</Badge>
        <Badge variant="outline">Total {roster.length}</Badge>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
        {roster.map((s:any)=>(
          <div key={s.id} className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 border-2 transition-all ${
            s.od ? 'bg-blue-100 border-blue-400' : s.present ? 'bg-success/15 border-success' : 'bg-destructive/10 border-destructive/40'}`}
            title={s.fullName}>
            <div className="text-[10px] font-bold truncate w-full px-1 text-center">{s.rollNumber}</div>
            <div className="text-[8px] text-muted-foreground truncate w-full px-1 text-center">{s.fullName?.split(' ')[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════ LIVE FEED ══════════════ */
function LiveFeed() {
  const [session, setSession] = useState<any>(null);
  const [feed, setFeed] = useState<any[]>([]);
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/teacher/allocations');
        if (!data.activeSession) return;
        setSession(data.activeSession);
        const { data: f } = await api.get(`/teacher/sessions/${data.activeSession.id}/feed`);
        setFeed(f);
      } catch {}
    };
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Live Feed</h1>
      <Card className="shadow-soft">
        <CardContent className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
          {feed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {session ? 'Waiting for students…' : 'Start a session to see the feed.'}
            </div>
          )}
          {feed.map((r:any,i:number)=>(
            <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">{r.studentName?.[0]??'?'}</div>
                <div>
                  <div className="font-semibold text-sm">{r.studentName}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.rollNumber} · {new Date(r.markedAt).toLocaleTimeString()}
                    {r.manual && <span className="ml-2 text-primary font-semibold">👨‍🏫</span>}
                    {r.od && <span className="ml-2 text-blue-500 font-semibold">📋 OD</span>}
                  </div>
                </div>
              </div>
              <Badge className={r.status==='PRESENT'?'bg-success text-success-foreground':r.status==='OD'?'bg-blue-500 text-white':'bg-destructive text-destructive-foreground'}>{r.status}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ══════════════ STUDENTS TAB ══════════════ */
function StudentsTab() {
  const [dept, setDept] = useState('');
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!dept || !year || !section) { setRows([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`/teacher/students?department=${dept}&year=${year}&section=${section}`);
      setRows(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [dept, year, section]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Students</h1>
      <Card className="shadow-soft"><CardContent className="p-5 grid grid-cols-3 gap-3">
        <div><label className="text-sm font-semibold block mb-1.5">Department</label>
          <Select value={dept} onValueChange={setDept}><SelectTrigger><SelectValue placeholder="Dept"/></SelectTrigger><SelectContent>{DEPTS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
        <div><label className="text-sm font-semibold block mb-1.5">Year</label>
          <Select value={year} onValueChange={setYear}><SelectTrigger><SelectValue placeholder="Year"/></SelectTrigger><SelectContent>{YEARS.map(y=><SelectItem key={y} value={y}>Year {y}</SelectItem>)}</SelectContent></Select></div>
        <div><label className="text-sm font-semibold block mb-1.5">Section</label>
          <Select value={section} onValueChange={setSection}><SelectTrigger><SelectValue placeholder="Sec"/></SelectTrigger><SelectContent>{SECTIONS.map(s=><SelectItem key={s} value={s}>Sec {s}</SelectItem>)}</SelectContent></Select></div>
      </CardContent></Card>

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground">
              <tr><th className="text-left p-3">Roll</th><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">Loading…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">{dept&&year&&section?'No students found.':'Select dept, year and section above.'}</td></tr>}
              {rows.map((r:any)=>(
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-mono">{r.rollNumber??'—'}</td>
                  <td className="p-3 font-semibold">{r.fullName}</td>
                  <td className="p-3 text-muted-foreground">{r.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}