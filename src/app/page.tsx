'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import LandingMap from '@/components/landing/landing-map';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Icons } from '@/components/icons';

export default function HomePage() {
  const router = useRouter();

  const handleLogin = () => {
    // In a real app, this would involve a proper auth flow.
    // For this demo, we'll just set a flag in localStorage.
    localStorage.setItem('user_authenticated', 'true');
    router.push('/dashboard');
  };

  return (
    <div className="relative h-screen w-screen">
      <div className="absolute inset-0">
        <LandingMap />
      </div>
      <div className="absolute top-0 left-0 right-0 z-10 flex h-full flex-col items-center justify-center bg-gradient-to-t from-background via-background/80 to-transparent p-8 text-center">
        <div className="flex-grow"></div>
        <div className="mb-12 flex flex-col items-center gap-6 rounded-xl bg-background/80 p-8 shadow-2xl backdrop-blur-sm">
          <Icons.Logo className="h-20 w-auto" />
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
            Welcome to RouteWise
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Optimize your fleet's routes, monitor vehicles in real-time, and gain valuable insights with our intelligent platform.
          </p>
          <Button size="lg" onClick={handleLogin}>
            Go to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
