import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/language-context';
import { SettingsProvider } from '@/context/settings-context';
import BottomNav from '@/components/bottom-nav';
import { Alegreya, Noto_Kufi_Arabic } from 'next/font/google';

const alegreya = Alegreya({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-alegreya',
});

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-noto-kufi-arabic',
});

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
      <body className={`${alegreya.variable} ${notoKufiArabic.variable} font-sans antialiased`}>
        <LanguageProvider>
          <SettingsProvider>
            <div className="max-w-md mx-auto bg-background shadow-lg min-h-screen flex flex-col">
              <main className="flex-grow pb-20">
                {children}
              </main>
              <BottomNav />
            </div>
            <Toaster />
          </SettingsProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
