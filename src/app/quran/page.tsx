'use client';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function QuranPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <div className="max-w-md mx-auto bg-white dark:bg-black shadow-lg h-screen flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" className="hover:bg-primary/80">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Quran</h1>
        </header>
        <main className="flex-grow p-4">
          <Card>
            <CardHeader>
              <CardTitle>Read the Quran</CardTitle>
            </CardHeader>
            <CardContent>
              <p>The Quran section is under development. In the meantime, you can read the Holy Quran at <a href="https://quran.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Quran.com</a>.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
