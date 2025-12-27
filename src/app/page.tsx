import HijriCalendar from '@/components/hijri-calendar';

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary tracking-tight">
            HijriSync
          </h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
            A modern Gregorian-Hijri calendar with important Islamic events highlighted.
          </p>
        </header>
        
        <HijriCalendar />

        <footer className="text-center mt-8 text-sm text-muted-foreground">
            <p>
                Hijri date may vary based on local moon sightings. Use the adjustment buttons for accuracy.
            </p>
            <p className="mt-1">
                Built for a seamless cultural and spiritual experience.
            </p>
        </footer>
      </div>
    </main>
  );
}
