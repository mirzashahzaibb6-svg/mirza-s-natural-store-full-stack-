import type { Metadata, Viewport } from 'next';
import { Bodoni_Moda, Jost } from 'next/font/google';
import { Lantern } from '@/components/layout/lantern';
import { Providers } from '@/components/layout/providers';
import { SiteHeader } from '@/components/layout/site-header';
import { BRAND } from '@/lib/config';
import './globals.css';

const display = Bodoni_Moda({ subsets: ['latin'], variable: '--font-bodoni', display: 'swap' });
const sans = Jost({ subsets: ['latin'], variable: '--font-jost', display: 'swap' });

export const metadata: Metadata = { title: { default: BRAND, template: `%s | ${BRAND}` }, description: 'Fine groceries, delivered with care.' };
export const viewport: Viewport = { themeColor: '#0e0509', viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <Providers>
          <Lantern />
          <SiteHeader />
          <main className="relative z-10 min-h-svh">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
