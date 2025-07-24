'use client';
import { useState, useEffect } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Icons } from '@/components/icons';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" className="dark">
      <head>
        <title>RouteWise</title>
        <meta name="description" content="Intelligent Route Optimization for Fleet Management" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className="font-body antialiased">
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background animate-fade-out" style={{animationDelay: '1.5s'}}>
            <div className="animate-pulse-slow">
              <Icons.Logo className="h-24 w-24" />
            </div>
          </div>
        )}
        {!loading && children}
        <Toaster />
      </body>
    </html>
  );
}
