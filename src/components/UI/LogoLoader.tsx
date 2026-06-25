import { useState, useEffect } from 'react';
import eduIcon from "@/assets/edu-zambia-icon.png";

interface LogoLoaderProps {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const sizeConfig = {
  sm: { logo: 24, container: 44 },
  md: { logo: 36, container: 56 },
  lg: { logo: 48, container: 72 },
};

const TIPS = [
  "Spaced repetition boosts retention by 200%",
  "Teaching others is the best way to learn",
  "Short study sessions beat cramming",
  "Active recall beats re-reading by 150%",
  "Exercise before studying improves focus",
  "Your brain consolidates memories during sleep",
];

export function LogoLoader({ size = "md", text }: LogoLoaderProps) {
  const s = sizeConfig[size];
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-5 min-h-[140px] w-full">
      <div className="relative" style={{ width: s.container, height: s.container }}>
        {/* Pulse ring */}
        <div
          className="absolute inset-[-4px] rounded-2xl border border-primary/15"
          style={{ animation: 'pulse-ring 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        />
        
        {/* Logo container */}
        <div
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card border border-border/30 shadow-elevated"
          style={{ animation: 'fadeIn 0.5s ease-out' }}
        >
          <img src={eduIcon} alt="Nexus Learning" style={{ width: s.logo, height: s.logo }} className="rounded-xl" />
        </div>
      </div>

      {text && (
        <p className="text-[13px] text-muted-foreground font-medium animate-fade-in">
          {text}
        </p>
      )}

      <p key={tipIndex} className="text-[11px] text-muted-foreground/40 max-w-xs text-center animate-fade-in">
        💡 {TIPS[tipIndex]}
      </p>
    </div>
  );
}
