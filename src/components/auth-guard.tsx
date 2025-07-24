'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // This check runs only on the client-side
    const authStatus = localStorage.getItem('user_authenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    } else {
      router.replace('/');
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
     return null; // Or a loading spinner, but redirection should be fast
  }

  return <>{children}</>;
}
