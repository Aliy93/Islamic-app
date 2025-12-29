import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function QiblaFinderPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 font-sans">
      <div className="max-w-md mx-auto bg-white dark:bg-black shadow-lg h-screen flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4">
          <Link href="/" passHref>
            <Button variant="ghost" size="icon" className="hover:bg-primary/80">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Qibla Finder</h1>
        </header>
        <main className="flex-grow">
          <iframe
            src="https://qiblafinder.withgoogle.com/intl/en/desktop"
            className="w-full h-full border-0"
            allow="camera; geolocation"
            title="Qibla Finder"
          ></iframe>
        </main>
      </div>
    </div>
  );
}
