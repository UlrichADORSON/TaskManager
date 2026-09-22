import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProvider } from '@/lib/app-context';
import { ThemeProvider } from '@/lib/theme-provider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ProFlow — Gestion de Projets',
  description: 'Plateforme de gestion de projets multi-rôles pour clients, administrateurs, managers et employés.',
};

const noFlashScript = `(function(){try{var d=document.documentElement,c=d.classList;c.remove('light','dark');var e=localStorage.getItem('theme');if(e){c.add(e);}else{c.add('light');}d.style.colorScheme=(e==='light'||e==='dark'||!e)?(e||'light'):'';}catch(t){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}