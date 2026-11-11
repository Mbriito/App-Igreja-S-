import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center gap-3 rounded-2xl bg-[#df982a] px-4 py-3 text-sm font-bold text-white shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="p-1.5 bg-white/20 rounded-lg">
        <WifiOff className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="leading-tight">Modo Offline</p>
        <p className="text-[10px] font-medium opacity-90">Exibindo avisos salvos anteriormente.</p>
      </div>
      <div className="h-2 w-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
    </div>
  );
};
