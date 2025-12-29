'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function QuranPage() {
  return (
    <div className="h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4">
        <Link href="/" passHref>
          <Button variant="ghost" size="icon" className="hover:bg-primary/80">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Quran</h1>
      </header>
      <main className="flex-grow">
        <iframe
          src="https://tanzil.net/#19:1"
          className="w-full h-full border-0"
          title="Quran Reader"
        ></iframe>
      </main>
    </div>
  );
}
