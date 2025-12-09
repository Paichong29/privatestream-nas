
import React from 'react';
import { Notification } from '../types';
import { Check, Info, AlertTriangle, AlertCircle, CheckCircle, Bell, X } from 'lucide-react';

interface NotificationDropdownProps {
  notifications: Notification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
    notifications, 
    isOpen, 
    onClose,
    onMarkRead 
}) => {
  if (!isOpen) return null;

  const timeAgo = (timestamp: number) => {
      const seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return new Date(timestamp).toLocaleDateString();
  };

  const getIcon = (type: string) => {
      switch (type) {
          case 'SUCCESS': return <CheckCircle size={16} className="text-emerald-400" />;
          case 'WARN': return <AlertTriangle size={16} className="text-yellow-400" />;
          case 'ERROR': return <AlertCircle size={16} className="text-red-400" />;
          default: return <Info size={16} className="text-blue-400" />;
      }
  };

  return (
    <div 
        className="absolute right-0 top-full mt-2 w-80 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-2 fade-in duration-200 overflow-hidden flex flex-col max-h-[400px]"
        onClick={(e) => e.stopPropagation()}
    >
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
            <h3 className="font-semibold text-sm text-zinc-200 flex items-center gap-2">
                <Bell size={14} /> Notifications
            </h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded hover:bg-zinc-800">
                <X size={14} />
            </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-1">
            {notifications.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-sm">
                    No notifications
                </div>
            ) : (
                <div className="space-y-1">
                    {notifications.map(n => (
                        <div 
                            key={n.id} 
                            className={`p-3 rounded-lg flex gap-3 transition-colors ${n.isRead ? 'opacity-60 hover:opacity-100 hover:bg-zinc-800/30' : 'bg-zinc-800/40 hover:bg-zinc-800/80 border-l-2 border-indigo-500'}`}
                        >
                            <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className={`text-sm font-medium ${n.isRead ? 'text-zinc-400' : 'text-zinc-100'}`}>{n.title}</h4>
                                    <span className="text-[10px] text-zinc-500 whitespace-nowrap ml-2">{timeAgo(n.createdAt)}</span>
                                </div>
                                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                                {!n.isRead && (
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }}
                                        className="mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                                    >
                                        <Check size={10} /> Mark read
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
};
