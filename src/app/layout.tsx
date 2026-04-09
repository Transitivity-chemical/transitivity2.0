import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.min.css';
import './globals.css';
import { ConfirmDialogProvider } from '@/components/providers/ConfirmDialogProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Transitivity 2.0',
  description: 'Computational Chemistry SaaS Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} style={{ fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' }}>
        <ConfirmDialogProvider>
          {children}
        </ConfirmDialogProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
