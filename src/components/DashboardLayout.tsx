import { ReactNode, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { AuraLogo } from '@/components/AuraLogo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';
import {
  LayoutDashboard, QrCode, BookOpen, Clock, Activity, History, Users,
  Calendar, AlertTriangle, GraduationCap, BookCopy, Bell, LogOut, Menu, X, ChevronRight,
  UserCheck, CalendarDays, Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';

type NavItem = { to: string; label: string; icon: any };

const NAV: Record<AppRole, NavItem[]> = {
  student: [
    { to: '/student', label: 'My Overview', icon: LayoutDashboard },
    { to: '/student/mark', label: 'Mark Attendance', icon: QrCode },
    { to: '/student/teachers', label: 'My Teachers', icon: UserCheck },
    { to: '/student/subjects', label: 'Subject Stats', icon: BookOpen },
    { to: '/student/history', label: 'History', icon: History },
    { to: '/student/device', label: 'My Device', icon: Smartphone },
  ],
  teacher: [
    { to: '/teacher', label: 'Live Session', icon: QrCode },
    { to: '/teacher/heatmap', label: 'Live Heatmap', icon: LayoutDashboard },
    { to: '/teacher/feed', label: 'Live Feed', icon: Activity },
    { to: '/teacher/history', label: 'Session History', icon: History },
    { to: '/teacher/students', label: 'Students', icon: Users },
  ],
  admin: [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard },
    { to: '/admin/semester', label: 'Semester', icon: Calendar },
    { to: '/admin/holidays', label: 'Holidays', icon: CalendarDays },
    { to: '/admin/sections', label: 'Sections & Teachers', icon: Users },
    { to: '/admin/students', label: 'Students', icon: GraduationCap },
    { to: '/admin/teachers', label: 'Teachers', icon: UserCheck },
    { to: '/admin/subjects', label: 'Subjects', icon: BookCopy },
    { to: '/admin/slots', label: 'Registration Slots', icon: Clock },
    { to: '/admin/device-requests', label: 'Device Requests', icon: Smartphone },
    { to: '/admin/suspicious', label: 'Suspicious Activity', icon: AlertTriangle },
  ],
};

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { profile, role, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const items = role ? NAV[role] : [];

  useEffect(() => { setOpen(false); }, [loc.pathname]);

  // Load notification count
  useEffect(() => {
    if (!profile?.id || role !== 'student') return;
    api.get('/student/notifications')
      .then(({ data }) => setUnread(data.unread ?? 0))
      .catch(() => {});
  }, [profile?.id, role]);

  const handleSignOut = () => {
    signOut();
    toast.success('Signed out');
    nav('/login');
  };

  const sidebar = (
    <aside className="w-72 sm:w-64 shrink-0 bg-sidebar border-r border-sidebar-border h-full flex flex-col">
      <div className="px-5 py-5 border-b border-sidebar-border flex items-center justify-between">
        <AuraLogo />
        <Button variant="ghost" size="icon" className="md:hidden" onClick={()=>setOpen(false)}><X className="h-4 w-4" /></Button>
      </div>
      <div className="px-5 py-4 border-b border-sidebar-border">
        <div className="text-sm font-bold truncate">{profile?.fullName ?? 'Loading…'}</div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">{role}</Badge>
          {profile?.department && <Badge variant="outline" className="text-[10px]">{profile.department}</Badge>}
          {profile?.year && <Badge variant="outline" className="text-[10px]">Y{profile.year}</Badge>}
          {profile?.section && <Badge variant="outline" className="text-[10px]">Sec {profile.section}</Badge>}
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map(item => (
          <NavLink key={item.to} to={item.to} end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}>
            <item.icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-secondary/30">
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0">{sidebar}</div>
        </div>
      )}
      <div className="hidden md:block">{sidebar}</div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-3 sm:px-4 md:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={()=>setOpen(true)}><Menu className="h-5 w-5" /></Button>
            <div className="text-sm font-semibold text-muted-foreground truncate">
              {items.find(i => i.to === loc.pathname)?.label ?? 'Dashboard'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsBell unread={unread} setUnread={setUnread} role={role} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-6">{children}</main>

        {role && (
          <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border flex items-stretch justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
            {items.slice(0, 5).map((item) => (
              <NavLink key={item.to} to={item.to} end
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                <item.icon className="h-5 w-5" />
                <span className="truncate max-w-[64px]">{item.label.split(' ')[0]}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

function NotificationsBell({ unread, setUnread, role }: { unread: number; setUnread: (n: number) => void; role: AppRole | null }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (role !== 'student') return;
    try {
      const { data } = await api.get('/student/notifications');
      setItems(data.notifications ?? []);
    } catch {}
  };

  useEffect(() => { if (open) load(); }, [open]);

  const markAll = async () => {
    try {
      await api.put('/student/notifications/read-all');
      setUnread(0);
      load();
    } catch {}
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen(o => !o)}><Bell className="h-4 w-4" /></Button>
      {unread > 0 && (
        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">{unread}</span>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-[88vw] max-w-sm bg-card border border-border rounded-xl shadow-lg z-50 max-h-[70vh] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="font-bold text-sm">Notifications</div>
              {unread > 0 && <Button size="sm" variant="ghost" className="text-xs h-7" onClick={markAll}>Mark all read</Button>}
            </div>
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No notifications yet.</div>}
              {items.map((n: any) => (
                <div key={n.id} className={`px-4 py-3 border-b border-border ${n.isRead ? '' : 'bg-accent/40'}`}>
                  <div className="text-sm font-semibold">{n.title}</div>
                  {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
                  <div className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
