import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuraLogo } from '@/components/AuraLogo';
import {
  QrCode, Fingerprint, Bot, Activity, Mail, TrendingUp,
  ShieldCheck, Zap, Users, ArrowRight, CheckCircle2, Sparkles
} from 'lucide-react';

const features = [
  { icon: QrCode, title: 'Auto-Refresh QR', desc: 'Server-signed tokens rotate every 60 seconds. Screenshots become useless.', color: 'from-indigo-500 to-purple-500' },
  { icon: Fingerprint, title: 'Device Fingerprint', desc: '6-point browser fingerprint blocks proxies trying to scan from a second device.', color: 'from-purple-500 to-pink-500' },
  { icon: ShieldCheck, title: 'One-Time Codes', desc: 'Backup short codes are revealed for just 15 seconds when students request them.', color: 'from-pink-500 to-rose-500' },
  { icon: Activity, title: 'Live Attendance Feed', desc: 'Realtime stream of students as they appear — no refresh needed.', color: 'from-emerald-500 to-teal-500' },
  { icon: Bot, title: 'AURA AI Assistant', desc: 'Gemini-powered chatbot answers attendance questions for students.', color: 'from-blue-500 to-cyan-500' },
  { icon: TrendingUp, title: 'Risk Predictor', desc: 'AI predicts who will fall below 75% and sends smart nudges.', color: 'from-amber-500 to-orange-500' },
];

const steps = [
  { n: '01', t: 'Teacher starts session', d: 'Picks subject and section, hits Start. QR is armed.' },
  { n: '02', t: 'QR rotates every 60s', d: 'Students scan from class. Short code as fallback.' },
  { n: '03', t: 'Live feed updates', d: 'Names stream in instantly. Suspicious scans flagged.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/40">
        <div className="container flex h-16 items-center justify-between">
          <AuraLogo />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button size="sm" className="bg-gradient-primary shadow-md hover:shadow-glow transition-all">Sign in</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
        <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />

        <div className="container relative py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent border border-primary/20 text-xs font-semibold text-primary mb-6">
                <Sparkles className="h-3.5 w-3.5" /> Built for engineering colleges
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[0.95] mb-6">
                Smart attendance.
                <span className="block text-gradient">Zero proxies.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
                AURA combines rotating QR codes and device fingerprinting to make proxy attendance impossible — while teachers see every scan live.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/login">
                  <Button size="lg" className="bg-gradient-primary shadow-lg hover:shadow-glow transition-all text-base h-12 px-6">
                    Sign in to AURA <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how">
                  <Button size="lg" variant="outline" className="text-base h-12 px-6">See how it works</Button>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> No app install</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Realtime sync</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> AI-assisted</div>
              </div>
            </div>

            {/* Mockup */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-3xl" />
              <div className="relative bg-card border border-border rounded-3xl shadow-lg p-8 animate-float">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">LIVE SESSION</div>
                    <div className="text-lg font-bold">VLSI Design · Sec A</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative h-2.5 w-2.5">
                      <div className="absolute inset-0 rounded-full bg-success animate-ping" />
                      <div className="absolute inset-0 rounded-full bg-success" />
                    </div>
                    <span className="text-xs font-semibold text-success">LIVE</span>
                  </div>
                </div>
                <div className="aspect-square bg-gradient-mesh rounded-2xl mb-6 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,hsl(var(--primary)/0.1)_50%,transparent_75%)] bg-[length:200%_200%] animate-shimmer" />
                  <QrCode className="h-32 w-32 text-primary" strokeWidth={1.2} />
                </div>
                <div className="space-y-2.5">
                  {[
                    { n: 'Aarav Sharma', r: '21EC101', t: '2s ago' },
                    { n: 'Priya Patel', r: '21EC102', t: '4s ago' },
                    { n: 'Rahul Kumar', r: '21EC104', t: '7s ago' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-secondary rounded-lg animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i*100}ms` }}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{s.n[0]}</div>
                        <div>
                          <div className="text-sm font-semibold">{s.n}</div>
                          <div className="text-xs text-muted-foreground">{s.r} · {s.t}</div>
                        </div>
                      </div>
                      <div className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded">PRESENT</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-24">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Features</div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Everything you need to kill proxies</h2>
          <p className="text-lg text-muted-foreground">A complete attendance OS — for students, teachers, and admins.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div key={i} className="group relative bg-gradient-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/30 transition-all">
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.color} shadow-md mb-4`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-secondary/50 border-y border-border">
        <div className="container py-24">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <div className="text-xs font-bold text-primary uppercase tracking-widest mb-3">How it works</div>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Three steps. One minute.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {steps.map((s, i) => (
              <div key={i} className="relative bg-card border border-border rounded-2xl p-8">
                <div className="text-6xl font-extrabold text-gradient mb-4">{s.n}</div>
                <h3 className="text-xl font-bold mb-2">{s.t}</h3>
                <p className="text-muted-foreground">{s.d}</p>
                {i < 2 && <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/40 z-10" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24">
        <div className="relative overflow-hidden bg-gradient-primary rounded-3xl p-12 md:p-16 text-center shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white,transparent_70%)] opacity-20" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-extrabold text-primary-foreground mb-4 tracking-tight">Ready to end proxy attendance?</h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">Accounts are created by your college admin. Sign in with the credentials you received.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/login"><Button size="lg" variant="secondary" className="text-base h-12 px-6">Sign in</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <AuraLogo />
          <div>© {new Date().getFullYear()} AURA · Built for engineering colleges</div>
        </div>
      </footer>
    </div>
  );
}
