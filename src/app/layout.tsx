import type { Metadata, Viewport } from 'next';
import { Inter, Orbitron, JetBrains_Mono } from 'next/font/google';
import { ClientOnly } from '@/components/client-only';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const orbitron = Orbitron({ 
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Angelina AI - Personal AI Operating System',
  description: 'Your intelligent assistant for personal and business automation',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Angelina AI',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="bg-deep-space text-text-primary font-inter antialiased" suppressHydrationWarning>
        <ClientOnly>{children}</ClientOnly>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(regs) {
                  regs.forEach(function(r) { r.update(); });
                });
                navigator.serviceWorker.register('/sw.js').then(
                  function(reg) {
                    reg.update();
                    console.log('[SW] Registered:', reg.scope);
                  },
                  function(err) { console.log('[SW] Registration failed:', err); }
                );
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
