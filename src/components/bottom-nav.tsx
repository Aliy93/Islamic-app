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
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border shadow-t-lg">
      <div className="flex justify-around items-center h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link href={href} key={label} className="flex flex-col items-center justify-center text-center w-full no-underline">
              <Icon className={cn('w-6 h-6 mb-1', isActive ? 'text-primary' : 'text-muted-foreground')} />
              <span className={cn('text-xs font-medium',  isActive ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
