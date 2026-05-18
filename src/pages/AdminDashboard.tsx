import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from 'react-router-dom';
import { Users, Calendar, GraduationCap, BookCopy, Clock, AlertTriangle, Plus, Trash2, CheckCircle2, CalendarDays, UserCheck, Smartphone, CheckCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { ChatbotWidget } from '@/components/ChatbotWidget';

const DEPTS = ['ECE','CSE','IT','AIDS','MECH','CIVIL','EEE'];

export default function AdminDashboard() {
  const path = useLocation().pathname.split('/')[2] ?? '';
  return (
    <>
      <DashboardLayout>
        {path === '' ? <Overview /> :
         path === 'semester' ? <SemesterTab /> :
         path === 'holidays' ? <HolidaysTab /> :
         path === 'sections' ? <SectionsTab /> :
         path === 'students' ? <StudentsTab /> :
         path === 'teachers' ? <TeachersTab /> :
         path === 'subjects' ? <SubjectsTab /> :
         path === 'slots' ? <SlotsTab /> :
         path === 'suspicious' ? <SuspiciousTab /> :
         path === 'device-requests' ? <DeviceRequestsTab /> : <Overview />}
      </DashboardLayout>
      <ChatbotWidget />
    </>
  );
}

function Overview() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, semester: 'None', suspicious: 0, pendingDeviceRequests: 0 });
  useEffect(() => {
    api.get('/admin/overview').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const cards = [
    { label: 'Total Students', value: stats.students, icon: GraduationCap, color: 'from-indigo-500 to-purple-500' },
    { label: 'Total Teachers', value: stats.teachers, icon: Users, color: 'from-emerald-500 to-teal-500' },
    { label: 'Active Semester', value: stats.semester, icon: Calendar, color: 'from-blue-500 to-cyan-500' },
    { label: 'Suspicious', value: stats.suspicious, icon: AlertTriangle, color: stats.suspicious>0?'from-rose-500 to-red-500':'from-slate-400 to-slate-500' },
    { label: 'Device Requests', value: stats.pendingDeviceRequests, icon: Smartphone, color: stats.pendingDeviceRequests>0?'from-amber-500 to-orange-500':'from-slate-400 to-slate-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Your institution at a glance.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c,i)=>(
          <Card key={i} className="shadow-soft overflow-hidden relative">
            <div className={`absolute top-0 right-0 h-24 w-24 bg-gradient-to-br ${c.color} opacity-10 blur-2xl rounded-full`} />
            <CardContent className="p-5 relative">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} mb-3 shadow-md`}>
                <c.icon className="h-5 w-5 text-white" />
              </div>
              <div className="text-3xl font-extrabold">{c.value}</div>
              <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SemesterTab() {
  const [sems, setSems] = useState<any[]>([]);
  const [f, setF] = useState({ name:'', academicYear:'', semesterType:'ODD', startDate:'', endDate:'' });

  const reload = () => api.get('/admin/semesters').then(({ data }) => setSems(data)).catch(() => {});
  useEffect(() => { reload(); }, []);

  const create = async () => {
    try {
      await api.post('/admin/semesters', f);
      toast.success('Semester created'); reload();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };
  const activate = async (id: number) => {
    try { await api.put(`/admin/semesters/${id}/activate`); toast.success('Activated'); reload(); }
    catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };
  const del = async (id: number) => {
    try { await api.delete(`/admin/semesters/${id}`); reload(); }
    catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Semester</h1>
      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Create Semester</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2"><Label>Name</Label><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})} placeholder="ODD SEM 2025-26" /></div>
          <div><Label>Academic Year</Label><Input value={f.academicYear} onChange={e=>setF({...f,academicYear:e.target.value})} placeholder="2025-26" /></div>
          <div><Label>Type</Label>
            <Select value={f.semesterType} onValueChange={v=>setF({...f,semesterType:v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="ODD">ODD</SelectItem><SelectItem value="EVEN">EVEN</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Start</Label><Input type="date" value={f.startDate} onChange={e=>setF({...f,startDate:e.target.value})} /></div>
          <div><Label>End</Label><Input type="date" value={f.endDate} onChange={e=>setF({...f,endDate:e.target.value})} /></div>
          <Button onClick={create} className="md:col-span-5 bg-gradient-primary"><Plus className="h-4 w-4 mr-2" />Create</Button>
        </CardContent>
      </Card>
      <div className="grid md:grid-cols-2 gap-3">
        {sems.map((s:any)=>(
          <Card key={s.id} className="shadow-soft">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <div className="font-bold flex items-center gap-2">{s.name}{s.isActive && <Badge className="bg-success text-success-foreground">ACTIVE</Badge>}</div>
                <div className="text-xs text-muted-foreground">{s.startDate} → {s.endDate}</div>
              </div>
              <div className="flex gap-1">
                {!s.isActive && <Button size="sm" variant="outline" onClick={()=>activate(s.id)}><CheckCircle2 className="h-3.5 w-3.5" /></Button>}
                <Button size="sm" variant="ghost" onClick={()=>del(s.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HolidaysTab() {
  const [allSems, setAllSems] = useState<any[]>([]);
  const [semId, setSemId] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({ holidayDate: '', description: '', holidayType: 'COLLEGE' });

  useEffect(() => {
    api.get('/admin/semesters').then(({ data }) => {
      setAllSems(data);
      const active = data.find((s:any) => s.isActive);
      if (active) setSemId(String(active.id));
    }).catch(() => {});
  }, []);

  const load = async () => {
    if (!semId) return;
    api.get(`/admin/holidays?semesterId=${semId}`).then(({ data }) => setRows(data)).catch(() => {});
  };
  useEffect(() => { load(); }, [semId]);

  const add = async () => {
    try {
      await api.post('/admin/holidays', { ...f, semesterId: Number(semId) });
      toast.success('Holiday added'); setF({ holidayDate:'', description:'', holidayType:'COLLEGE' }); load();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };
  const del = async (id: number) => {
    try { await api.delete(`/admin/holidays/${id}`); load(); }
    catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };
  const seedSundays = async () => {
    try {
      const { data } = await api.post(`/admin/holidays/seed-sundays?semesterId=${semId}`);
      toast.success(`Added ${data.added} Sundays`); load();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Holidays Calendar</h1>
      <p className="text-sm text-muted-foreground -mt-2">Holidays and Sundays are excluded from working-day attendance %.</p>

      <Card className="shadow-soft"><CardContent className="p-5 grid md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2"><Label>Semester</Label>
          <Select value={semId} onValueChange={setSemId}>
            <SelectTrigger><SelectValue/></SelectTrigger>
            <SelectContent>{allSems.map((s:any) => <SelectItem key={s.id} value={String(s.id)}>{s.name} {s.isActive && '(active)'}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={seedSundays} disabled={!semId}><CalendarDays className="h-4 w-4 mr-2"/>Auto-add all Sundays</Button>
      </CardContent></Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Add Holiday</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <div><Label>Date</Label><Input type="date" value={f.holidayDate} onChange={e=>setF({...f,holidayDate:e.target.value})} /></div>
          <div className="md:col-span-2"><Label>Description</Label><Input value={f.description} onChange={e=>setF({...f,description:e.target.value})} placeholder="Diwali, Pongal, etc." /></div>
          <div><Label>Type</Label>
            <Select value={f.holidayType} onValueChange={v=>setF({...f,holidayType:v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="NATIONAL">National</SelectItem>
                <SelectItem value="FESTIVAL">Festival</SelectItem>
                <SelectItem value="COLLEGE">College</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={add} className="md:col-span-4 bg-gradient-primary"><Plus className="h-4 w-4 mr-2"/>Add Holiday</Button>
        </CardContent>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
              <th className="text-left p-3">Date</th><th className="text-left p-3">Day</th><th className="text-left p-3">Description</th><th className="text-left p-3">Type</th><th className="p-3"></th>
            </tr></thead>
            <tbody>
              {rows.length===0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No holidays yet for this semester.</td></tr>}
              {rows.map((r:any)=>(
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-mono">{r.holidayDate}</td>
                  <td className="p-3">{new Date(r.holidayDate).toLocaleDateString(undefined,{weekday:'short'})}</td>
                  <td className="p-3 font-semibold">{r.description}</td>
                  <td className="p-3"><Badge variant="outline">{r.holidayType}</Badge></td>
                  <td className="p-3"><Button size="sm" variant="ghost" onClick={()=>del(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SectionsTab() {
  const [dept, setDept] = useState('CSE'); const [year, setYear] = useState('1');
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const load = async () => {
    try {
      const { data } = await api.get(`/admin/sections?department=${dept}&year=${year}`);
      setAllTeachers(data.teachers ?? []);
      setSubjects(data.subjects ?? []);
      setAssignments(data.assignments ?? []);
    } catch {}
  };
  useEffect(() => { load(); }, [dept, year]);

  const assign = async (section: string, subjectId: number, teacherId: number) => {
    if (!subjectId || !teacherId) { toast.error('Pick subject + teacher'); return; }
    try {
      await api.post('/admin/sections/assign', { department: dept, year: Number(year), section, subjectId, teacherId });
      toast.success('Assigned'); load();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };
  const unassign = async (id: number) => {
    try { await api.delete(`/admin/sections/${id}`); load(); }
    catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Sections & Teacher Allocation</h1>
      <Card className="shadow-soft"><CardContent className="p-5 flex flex-wrap gap-3 items-end">
        <div><Label>Department</Label><Select value={dept} onValueChange={setDept}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent>{DEPTS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Year</Label><Select value={year} onValueChange={setYear}><SelectTrigger className="w-28"><SelectValue/></SelectTrigger><SelectContent>{['1','2','3','4'].map(y=><SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
      </CardContent></Card>

      {subjects.length === 0 && <Card className="shadow-soft"><CardContent className="p-6 text-center text-sm text-muted-foreground">No subjects defined for {dept} Year {year}. Add some in the Subjects tab first.</CardContent></Card>}

      {['A','B','C','D'].map(sec => (
        <Card key={sec} className="shadow-soft">
          <CardHeader><CardTitle className="text-base">Section {sec}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {subjects.map((sub:any) => {
              const a = assignments.find((x:any) => x.section===sec && x.subject?.id===sub.id);
              return (
                <div key={sub.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-sm font-semibold">{sub.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{sub.code}</div>
                  </div>
                  <Select value={a?.teacher?.id ? String(a.teacher.id) : ''} onValueChange={(v)=>assign(sec, sub.id, Number(v))}>
                    <SelectTrigger className="w-64"><SelectValue placeholder="Assign teacher…" /></SelectTrigger>
                    <SelectContent>
                      {allTeachers.length === 0 && <div className="p-3 text-xs text-muted-foreground">No teachers yet.</div>}
                      {allTeachers.map((t:any) => <SelectItem key={t.id} value={String(t.id)}>{t.fullName} {t.facultyId ? `(${t.facultyId})` : ''}{t.department ? ` · ${t.department}` : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {a && <Button size="sm" variant="ghost" onClick={()=>unassign(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button>}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StudentsTab() {
  const [dept,setDept]=useState('CSE'); const [year,setYear]=useState('1'); const [section,setSection]=useState('A');
  const [domain,setDomain]=useState('psnacet.edu.in');
  const [rows,setRows]=useState<any[]>([]);
  const [busy,setBusy]=useState(false);
  const [single,setSingle]=useState({ fullName:'', rollNumber:'', parentEmail:'', phone:'' });
  const [bulkText,setBulkText]=useState('');
  const [results,setResults]=useState<any[]>([]);

  const load = async () => {
    try {
      const { data } = await api.get(`/admin/students?department=${dept}&year=${year}&section=${section}`);
      setRows(data);
    } catch {}
  };
  useEffect(() => { load(); }, [dept, year, section]);

  const callCreate = async (students: any[]) => {
    setBusy(true);
    try {
      const { data } = await api.post('/admin/students/create', { domain, department: dept, year: Number(year), section, students });
      setResults(data.results ?? []);
      toast.success(`Created ${data.created}/${data.total}`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
    finally { setBusy(false); }
  };

  const addSingle = () => {
    if (!single.fullName || !single.rollNumber) { toast.error('Name & roll required'); return; }
    callCreate([single]);
    setSingle({ fullName:'', rollNumber:'', parentEmail:'', phone:'' });
  };

  const importBulk = () => {
    const lines = bulkText.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    if (!lines.length) { toast.error('Paste at least one row'); return; }
    const start = /name/i.test(lines[0]) ? 1 : 0;
    const students = lines.slice(start).map(l => {
      const [fullName, rollNumber, parentEmail, phone] = l.split(',').map(s=>s?.trim() ?? '');
      return { fullName, rollNumber, parentEmail, phone };
    }).filter(s=>s.fullName && s.rollNumber);
    if (!students.length) { toast.error('No valid rows'); return; }
    callCreate(students);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Students</h1>
        <Badge variant="outline" className="text-xs">{rows.length} in {dept}-Y{year}-{section}</Badge>
      </div>

      <Card className="shadow-soft"><CardContent className="p-5 grid md:grid-cols-4 gap-3">
        <div><Label>Dept</Label><Select value={dept} onValueChange={setDept}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{DEPTS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Year</Label><Select value={year} onValueChange={setYear}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['1','2','3','4'].map(y=><SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Section</Label><Select value={section} onValueChange={setSection}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['A','B','C','D'].map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>College Email Domain</Label><Input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="psnacet.edu.in" /></div>
      </CardContent></Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Add One Student</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2"><Label>Full Name</Label><Input value={single.fullName} onChange={e=>setSingle({...single,fullName:e.target.value})} placeholder="Ahalyaa R" /></div>
          <div><Label>Roll No.</Label><Input value={single.rollNumber} onChange={e=>setSingle({...single,rollNumber:e.target.value.toUpperCase()})} placeholder="22EC001" /></div>
          <div><Label>Parent Email</Label><Input value={single.parentEmail} onChange={e=>setSingle({...single,parentEmail:e.target.value})} placeholder="parent@gmail.com" /></div>
          <div><Label>Phone</Label><Input value={single.phone} onChange={e=>setSingle({...single,phone:e.target.value})} /></div>
          <Button onClick={addSingle} disabled={busy} className="md:col-span-5 bg-gradient-primary"><Plus className="h-4 w-4 mr-2"/>{busy?'Creating…':'Create student account'}</Button>
          <p className="md:col-span-5 text-xs text-muted-foreground">Email auto-generated · password = roll number.</p>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Bulk Add (CSV)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <textarea className="w-full h-40 p-3 text-sm font-mono bg-secondary border border-border rounded-lg"
            value={bulkText} onChange={e=>setBulkText(e.target.value)}
            placeholder={`fullName,rollNumber,parentEmail,phone\nAhalyaa R,22EC001,parent1@gmail.com,9876500001`} />
          <div className="flex gap-2">
            <Button onClick={importBulk} disabled={busy} className="bg-gradient-primary"><Plus className="h-4 w-4 mr-2"/>{busy?'Importing…':'Import all'}</Button>
            <Button variant="outline" onClick={()=>setBulkText('')}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {results.length>0 && (
        <Card className="shadow-soft"><CardHeader><CardTitle className="text-base">Last import results</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-60 overflow-y-auto text-xs">
            {results.map((r:any,i:number)=>(
              <div key={i} className={`p-2 rounded ${r.ok?'bg-success/10':'bg-destructive/10'}`}>
                {r.ok ? <span className="text-success-foreground">✅ {r.roll} → {r.email} (pw: {r.password})</span>
                      : <span className="text-destructive">❌ {r.roll} — {r.error}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
            <th className="text-left p-3">Roll</th><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Parent</th><th className="text-left p-3">Phone</th>
          </tr></thead>
          <tbody>
            {rows.length===0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No students yet for this class.</td></tr>}
            {rows.map((r:any)=><tr key={r.id} className="border-t border-border">
              <td className="p-3 font-mono">{r.rollNumber}</td>
              <td className="p-3 font-semibold">{r.fullName}</td>
              <td className="p-3 text-muted-foreground">{r.email}</td>
              <td className="p-3 text-muted-foreground">{r.parentEmail ?? '—'}</td>
              <td className="p-3 text-muted-foreground">{r.phone ?? '—'}</td>
            </tr>)}
          </tbody>
        </table></div>
      </Card>
    </div>
  );
}

function SubjectsTab() {
  const [rows,setRows]=useState<any[]>([]);
  const [f,setF]=useState({ name:'', code:'', credits:3, department:'ECE', year:1 });
  const load = () => api.get('/admin/subjects').then(({ data }) => setRows(data)).catch(() => {});
  useEffect(()=>{ load(); },[]);
  const add = async () => {
    try { await api.post('/admin/subjects', f); toast.success('Added'); setF({...f, name:'', code:''}); load(); }
    catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
  };
  const del = async (id:number) => { await api.delete(`/admin/subjects/${id}`); load(); };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Subjects</h1>
      <Card className="shadow-soft"><CardHeader><CardTitle className="text-base">Add Subject</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-6 gap-3">
          <div className="md:col-span-2"><Label>Name</Label><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})} /></div>
          <div><Label>Code</Label><Input value={f.code} onChange={e=>setF({...f,code:e.target.value})} /></div>
          <div><Label>Credits</Label><Input type="number" value={f.credits} onChange={e=>setF({...f,credits:Number(e.target.value)})} /></div>
          <div><Label>Dept</Label><Select value={f.department} onValueChange={v=>setF({...f,department:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{DEPTS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>Year</Label><Select value={String(f.year)} onValueChange={v=>setF({...f,year:Number(v)})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{['1','2','3','4'].map(y=><SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
          <Button onClick={add} className="md:col-span-6 bg-gradient-primary"><Plus className="h-4 w-4 mr-2"/>Add</Button>
        </CardContent>
      </Card>
      <Card className="shadow-soft overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">Subject</th><th className="text-left p-3">Code</th><th className="text-left p-3">Credits</th><th className="text-left p-3">Dept/Yr</th><th className="text-left p-3"></th></tr></thead>
        <tbody>{rows.map((r:any)=><tr key={r.id} className="border-t border-border">
          <td className="p-3 font-semibold">{r.name}</td><td className="p-3">{r.code}</td><td className="p-3">{r.credits}</td>
          <td className="p-3"><Badge variant="outline">{r.department} Y{r.year}</Badge></td>
          <td className="p-3"><Button size="sm" variant="ghost" onClick={()=>del(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></td>
        </tr>)}</tbody>
      </table></div></Card>
    </div>
  );
}

function SlotsTab() {
  const [rows,setRows]=useState<any[]>([]);
  const [f,setF]=useState({ startTime:'', endTime:'' });
  const load = () => api.get('/admin/slots').then(({ data }) => setRows(data)).catch(() => {});
  useEffect(()=>{ load(); },[]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Registration Slots</h1>
      <Card className="shadow-soft"><CardContent className="p-5 grid md:grid-cols-3 gap-3 items-end">
        <div><Label>Start</Label><Input type="datetime-local" value={f.startTime} onChange={e=>setF({...f,startTime:e.target.value})}/></div>
        <div><Label>End</Label><Input type="datetime-local" value={f.endTime} onChange={e=>setF({...f,endTime:e.target.value})}/></div>
        <Button className="bg-gradient-primary" onClick={async()=>{ await api.post('/admin/slots', f); load(); }}><Plus className="h-4 w-4 mr-2"/>Create</Button>
      </CardContent></Card>
      <Card className="shadow-soft overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">Start</th><th className="text-left p-3">End</th><th className="text-left p-3">Active</th><th className="text-left p-3"></th></tr></thead>
        <tbody>{rows.map((r:any)=><tr key={r.id} className="border-t border-border">
          <td className="p-3">{new Date(r.startTime).toLocaleString()}</td>
          <td className="p-3">{new Date(r.endTime).toLocaleString()}</td>
          <td className="p-3">{r.isActive?<Badge className="bg-success text-success-foreground">YES</Badge>:<Badge variant="secondary">NO</Badge>}</td>
          <td className="p-3"><Button size="sm" variant="ghost" onClick={async()=>{await api.delete(`/admin/slots/${r.id}`); load();}}><Trash2 className="h-3.5 w-3.5 text-destructive"/></Button></td>
        </tr>)}</tbody>
      </table></div></Card>
    </div>
  );
}

function SuspiciousTab() {
  const [rows,setRows]=useState<any[]>([]);
  useEffect(()=>{ api.get('/admin/suspicious').then(({ data }) => setRows(data)).catch(() => {}); },[]);
  const sevColor = (s:string) => s==='HIGH'?'bg-destructive text-destructive-foreground':s==='MEDIUM'?'bg-warning text-warning-foreground':'bg-secondary';
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Suspicious Activity</h1>
      <Card className="shadow-soft overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
          <th className="text-left p-3">Date</th><th className="text-left p-3">Student</th><th className="text-left p-3">Description</th><th className="text-left p-3">Severity</th>
        </tr></thead>
        <tbody>
          {rows.length===0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No suspicious activity yet.</td></tr>}
          {rows.map((r:any)=><tr key={r.id} className="border-t border-border">
            <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
            <td className="p-3 font-semibold">{r.student?.fullName ?? 'Unknown'} <span className="text-xs text-muted-foreground">{r.student?.rollNumber}</span></td>
            <td className="p-3 text-muted-foreground">{r.description}</td>
            <td className="p-3"><Badge className={sevColor(r.severity)}>{r.severity}</Badge></td>
          </tr>)}
        </tbody>
      </table></div></Card>
    </div>
  );
}

function TeachersTab() {
  const [dept, setDept] = useState('CSE');
  const [domain, setDomain] = useState('psnacet.edu.in');
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [single, setSingle] = useState({ fullName:'', facultyId:'', phone:'' });
  const [bulkText, setBulkText] = useState('');
  const [results, setResults] = useState<any[]>([]);

  const load = () => api.get('/admin/teachers').then(({ data }) => setRows(data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const callCreate = async (teachers: any[]) => {
    setBusy(true);
    try {
      const { data } = await api.post('/admin/teachers/create', { domain, department: dept, teachers });
      setResults(data.results ?? []);
      toast.success(`Created ${data.created}/${data.total}`);
      load();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
    finally { setBusy(false); }
  };

  const addSingle = () => {
    if (!single.fullName || !single.facultyId) { toast.error('Name & faculty ID required'); return; }
    callCreate([single]);
    setSingle({ fullName:'', facultyId:'', phone:'' });
  };

  const importBulk = () => {
    const lines = bulkText.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
    if (!lines.length) { toast.error('Paste at least one row'); return; }
    const start = /name/i.test(lines[0]) ? 1 : 0;
    const teachers = lines.slice(start).map(l => {
      const [fullName, facultyId, phone] = l.split(',').map(s=>s?.trim() ?? '');
      return { fullName, facultyId, phone };
    }).filter(t => t.fullName && t.facultyId);
    if (!teachers.length) { toast.error('No valid rows'); return; }
    callCreate(teachers);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Teachers</h1>
        <Badge variant="outline" className="text-xs">{rows.length} teachers</Badge>
      </div>

      <Card className="shadow-soft"><CardContent className="p-5 grid md:grid-cols-2 gap-3">
        <div><Label>Default Department</Label>
          <Select value={dept} onValueChange={setDept}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{DEPTS.map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
        </div>
        <div><Label>College Email Domain</Label><Input value={domain} onChange={e=>setDomain(e.target.value)} placeholder="psnacet.edu.in" /></div>
      </CardContent></Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><UserCheck className="h-4 w-4 text-primary"/>Add One Teacher</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-3">
          <div className="md:col-span-2"><Label>Full Name</Label><Input value={single.fullName} onChange={e=>setSingle({...single,fullName:e.target.value})} placeholder="Dr. Rajesh Kumar" /></div>
          <div><Label>Faculty ID</Label><Input value={single.facultyId} onChange={e=>setSingle({...single,facultyId:e.target.value.toUpperCase()})} placeholder="PSNA0123EC" /></div>
          <div><Label>Phone</Label><Input value={single.phone} onChange={e=>setSingle({...single,phone:e.target.value})} /></div>
          <Button onClick={addSingle} disabled={busy} className="md:col-span-4 bg-gradient-primary"><Plus className="h-4 w-4 mr-2"/>{busy?'Creating…':'Create teacher account'}</Button>
          <p className="md:col-span-4 text-xs text-muted-foreground">Email auto-generated · password = faculty ID.</p>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader><CardTitle className="text-base">Bulk Add (CSV)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <textarea className="w-full h-40 p-3 text-sm font-mono bg-secondary border border-border rounded-lg"
            value={bulkText} onChange={e=>setBulkText(e.target.value)}
            placeholder={`fullName,facultyId,phone\nDr. Rajesh Kumar,PSNA0123EC,9876500001`} />
          <div className="flex gap-2">
            <Button onClick={importBulk} disabled={busy} className="bg-gradient-primary"><Plus className="h-4 w-4 mr-2"/>{busy?'Importing…':'Import all'}</Button>
            <Button variant="outline" onClick={()=>setBulkText('')}>Clear</Button>
          </div>
        </CardContent>
      </Card>

      {results.length>0 && (
        <Card className="shadow-soft"><CardHeader><CardTitle className="text-base">Last import results</CardTitle></CardHeader>
          <CardContent className="space-y-1 max-h-60 overflow-y-auto text-xs">
            {results.map((r:any,i:number)=>(
              <div key={i} className={`p-2 rounded ${r.ok?'bg-success/10':'bg-destructive/10'}`}>
                {r.ok ? <span>✅ {r.facultyId} → {r.email} (pw: {r.password})</span>
                      : <span className="text-destructive">❌ {r.facultyId} — {r.error}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground"><tr>
              <th className="text-left p-3">Faculty ID</th><th className="text-left p-3">Name</th><th className="text-left p-3">Email</th><th className="text-left p-3">Dept</th><th className="text-left p-3">Phone</th>
            </tr></thead>
            <tbody>
              {rows.length===0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No teachers yet.</td></tr>}
              {rows.map((r:any)=><tr key={r.id} className="border-t border-border">
                <td className="p-3 font-mono">{r.facultyId}</td>
                <td className="p-3 font-semibold">{r.fullName}</td>
                <td className="p-3 text-muted-foreground">{r.email}</td>
                <td className="p-3">{r.department && <Badge variant="outline">{r.department}</Badge>}</td>
                <td className="p-3 text-muted-foreground">{r.phone ?? '—'}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function DeviceRequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState('PENDING');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    api.get(`/admin/device-requests?status=${filter}`)
      .then(({ data }) => setRequests(data))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id: number) => {
    setBusy(id);
    try {
      await api.put(`/admin/device-requests/${id}/approve`, { note: notes[id] || 'Approved by admin' });
      toast.success('Approved! Student notified.');
      load();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
    finally { setBusy(null); }
  };

  const decline = async (id: number) => {
    setBusy(id);
    try {
      await api.put(`/admin/device-requests/${id}/decline`, { note: notes[id] || 'Declined by admin' });
      toast.success('Declined. Student notified.');
      load();
    } catch (e: any) { toast.error(e.response?.data?.error ?? 'Failed'); }
    finally { setBusy(null); }
  };

  const statusColor = (s: string) =>
    s === 'APPROVED' ? 'bg-success text-success-foreground' :
    s === 'DECLINED' ? 'bg-destructive text-destructive-foreground' :
    'bg-warning text-warning-foreground';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Device Change Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Students request this when they change/lose their phone. Approve to update their registered device.
          </p>
        </div>
        <div className="flex gap-2">
          {['PENDING','APPROVED','DECLINED'].map(s => (
            <Button key={s} size="sm"
              variant={filter === s ? 'default' : 'outline'}
              className={filter === s ? 'bg-gradient-primary' : ''}
              onClick={() => setFilter(s)}>
              {s}
            </Button>
          ))}
        </div>
      </div>

      {requests.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="p-12 text-center text-muted-foreground text-sm">
            <Smartphone className="h-10 w-10 mx-auto mb-3 opacity-40" />
            No {filter.toLowerCase()} requests.
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {requests.map((r: any) => (
          <Card key={r.id} className="shadow-soft">
            <CardContent className="p-5 space-y-3">
              {/* Student info */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{r.studentName}</div>
                  <div className="text-xs text-muted-foreground">{r.studentRoll} · {r.studentEmail}</div>
                </div>
                <Badge className={statusColor(r.status)}>{r.status}</Badge>
              </div>

              {/* Device fingerprints */}
              <div className="bg-secondary rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Current device</span>
                  <span className="font-mono truncate">{r.currentFingerprint ? r.currentFingerprint.slice(0,20)+'…' : '— none —'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Requested device</span>
                  <span className="font-mono truncate text-primary">{r.newFingerprint.slice(0,20)}…</span>
                </div>
              </div>

              {/* Reason */}
              {r.reason && (
                <div className="text-xs">
                  <span className="font-semibold">Student's reason: </span>
                  <span className="text-muted-foreground">{r.reason}</span>
                </div>
              )}

              {/* Admin note (already resolved) */}
              {r.adminNote && r.status !== 'PENDING' && (
                <div className="text-xs">
                  <span className="font-semibold">Admin note: </span>
                  <span className="text-muted-foreground">{r.adminNote}</span>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Submitted: {new Date(r.createdAt).toLocaleString()}
                {r.resolvedAt && <> · Resolved: {new Date(r.resolvedAt).toLocaleString()}</>}
              </div>

              {/* Approve / Decline — only for pending */}
              {r.status === 'PENDING' && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <input
                    className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="Optional note to student…"
                    value={notes[r.id] ?? ''}
                    onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-success text-success-foreground hover:bg-success/90"
                      disabled={busy === r.id}
                      onClick={() => approve(r.id)}>
                      {busy === r.id ? '…' : <><CheckCheck className="h-3.5 w-3.5 mr-1.5"/>Approve</>}
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1"
                      disabled={busy === r.id}
                      onClick={() => decline(r.id)}>
                      {busy === r.id ? '…' : <><XCircle className="h-3.5 w-3.5 mr-1.5"/>Decline</>}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
