import { QrCode } from 'lucide-react';

export function AuraLogo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
          <QrCode className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
      </div>
      <div>
        <div className="text-lg font-extrabold tracking-tight leading-none">AURA</div>
        <div className="text-[9px] text-muted-foreground font-medium tracking-wide leading-none mt-0.5">ATTENDANCE OS</div>
      </div>
    </div>
  );
}
