import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/language-context';
import { SettingsProvider } from '@/context/settings-context';
import BottomNav from '@/components/bottom-nav';
import { Alegreya, Noto_Kufi_Arabic, Noto_Sans_Ethiopic } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Halal Lifestyle',
  description: 'Gregorian-Hijri Calendar with Islamic Events',
  icons: {
    icon: '/halal-logo.png'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <LanguageProvider>
          <SettingsProvider>
            <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-background shadow-lg">
              <main className="flex-grow pb-24">
                {children}
              </main>
            </div>
            <BottomNav />
            <Toaster />
          </SettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
