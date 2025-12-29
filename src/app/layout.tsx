import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/language-context';
import BottomNav from '@/components/bottom-nav';

export const metadata: Metadata = {
  title: 'Muslim App',
  description: 'Gregorian-Hijri Calendar with Islamic Events',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&family=Noto+Kufi+Arabic:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        <LanguageProvider>
          <div className="max-w-md mx-auto bg-background shadow-lg min-h-screen flex flex-col">
            <main className="flex-grow pb-20">
              {children}
            </main>
            <BottomNav />
          </div>
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
