"use client";

import { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Compass, Settings } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

function BottomNav() {
  const { lang } = useLanguage();
  const t = translations[lang];
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: t.home, icon: Home },
    { href: '/calendar', label: t.calendar, icon: Calendar },
    { href: '/qibla', label: t.qibla, icon: Compass },
    { href: '/settings', label: t.settings, icon: Settings },
  ];

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] will-change-transform"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-t-[28px] border border-border/50 border-b-0 bg-background/95 shadow-[0_-10px_30px_rgba(11,85,43,0.08)] supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-lg">
        <div className="flex h-20 items-center justify-around px-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link 
              href={href} 
              key={label} 
              className="relative flex flex-col items-center justify-center text-center w-full no-underline group"
            >
              <div className={cn(
                "p-2.5 rounded-xl transition-all duration-300 mb-1 relative flex items-center justify-center",
                isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground group-hover:text-primary/60'
              )}>
                <Icon className="w-5 h-5 relative z-10" />
              </div>
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider transition-colors duration-300',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {label}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              )}
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}

export default memo(BottomNav);
