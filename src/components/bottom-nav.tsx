'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Compass, Settings } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

export default function BottomNav() {
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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 dark:bg-card/80 backdrop-blur-lg border-t border-border/50 z-50">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link 
              href={href} 
              key={label} 
              className="relative flex flex-col items-center justify-center text-center w-full no-underline group"
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-300 mb-1",
                isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground group-hover:text-primary/60'
              )}>
                <Icon className={cn('w-6 h-6', isActive ? 'fill-current opacity-20 absolute scale-150' : '')} />
                <Icon className="w-6 h-6 relative z-10" />
              </div>
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {label}
              </span>
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
