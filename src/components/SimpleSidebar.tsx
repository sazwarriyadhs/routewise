'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function SimpleSidebar({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "transition-all duration-300 h-full bg-[#121212] border-r border-gray-800",
        collapsed ? "w-14" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-2">
        {!collapsed && <h2 className="text-white text-lg font-bold">Vehicles</h2>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-white"
        >
          {collapsed ? '›' : '‹'}
        </Button>
      </div>

      <div className={cn("overflow-y-auto px-2", collapsed && "hidden")}>
        {children}
      </div>
    </aside>
  );
}
