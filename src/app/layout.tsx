import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const haasGrotText = localFont({
  src: [
    {
      path: '../fonts/NeueHaasGrotText-55Roman.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/NeueHaasGrotText-56RomanItalic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/NeueHaasGrotText-65Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/NeueHaasGrotText-66MediumItalic.otf',
      weight: '500',
      style: 'italic',
    },
    {
      path: '../fonts/NeueHaasGrotText-75Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/NeueHaasGrotText-76BoldItalic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-haas-grot',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Hyperliquid Builders',
  description: 'Real-time revenue analytics dashboard for Hyperliquid builder codes',
  keywords: 'Hyperliquid, builder, revenue, analytics, dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${haasGrotText.className} text-foreground antialiased`}>
        {children}
      </body>
    </html>
  );
} 