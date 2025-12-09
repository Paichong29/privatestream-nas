import React, { useEffect } from 'react';
import { MediaFile } from '../types';
import { X, Play, Clock, Star, Calendar, User as UserIcon, Shield } from 'lucide-react';

interface MediaDetailModalProps {
    file: MediaFile;
    isOpen: boolean;
    onClose: () => void;
    onPlay: () => void;
}

import { api } from '../services/api';

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({ file, isOpen, onClose, onPlay }) => {
    const getAuthUrl = (url?: string) => {
        if (!url) return '';
        if (url.startsWith('http') && !url.includes(window.location.host)) return url;
        const token = api.getToken();
        return token ? `${url}${url.includes('?') ? '&' : '?'}token=${token}` : url;
    };
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-zinc-900 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-800 flex flex-col md:flex-row max-h-[90vh]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                    <X size={24} />
                </button>

                {/* Backdrop & Visuals (Left/Top) */}
                <div className="md:w-2/3 relative h-64 md:h-auto min-h-[400px]">
                    <div className="absolute inset-0">
                        {file.backdrop ? (
                            <img src={getAuthUrl(file.backdrop)} alt={file.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-black" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-zinc-900" />
                    </div>

                    {/* Play Button Overlay */}
                    <div className="absolute bottom-6 left-6 z-10">
                        <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg leading-tight">{file.name}</h1>
                        <div className="flex items-center gap-3 mb-6">
                            {file.rating && (
                                <span className="text-green-400 font-bold flex items-center gap-1">
                                    <span className="bg-green-500 text-black text-[10px] px-1 rounded font-bold">%</span> {file.rating}% Match
                                </span>
                            )}
                            <span className="text-zinc-300 text-sm">{file.year || '2024'}</span>
                            <span className="border border-zinc-600 px-1 text-[10px] text-zinc-400 rounded">4K</span>
                            <span className="text-zinc-300 text-sm flex items-center gap-1">
                                <Clock size={14} /> {file.duration || 'Unknown'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onPlay}
                                className="bg-white text-black px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-zinc-200 transition-colors"
                            >
                                <Play fill="currentColor" size={20} /> Play
                            </button>
                            <button className="bg-zinc-600/50 text-white px-6 py-3 rounded-lg font-bold hover:bg-zinc-600/80 transition-colors backdrop-blur-sm">
                                Trailer
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info & Cast (Right/Bottom) */}
                <div className="md:w-1/3 bg-zinc-900 p-6 overflow-y-auto border-l border-zinc-800">
                    <div className="space-y-6">

                        {/* Storage Badge */}
                        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
                            <Shield size={12} />
                            {file.storageLocation === 'LOCAL' ? 'Available on Local NVMe' : 'Stream from Secure Cloud'}
                        </div>

                        {/* Plot */}
                        <div>
                            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Synopsis</h3>
                            <p className="text-zinc-300 text-sm leading-relaxed">
                                {file.plot || file.aiDescription || "No synopsis available for this title."}
                            </p>
                        </div>

                        {/* Meta Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="text-zinc-500 text-xs mb-1">Director</h4>
                                <div className="text-white">{file.director || 'Unknown'}</div>
                            </div>
                            <div>
                                <h4 className="text-zinc-500 text-xs mb-1">Genre</h4>
                                <div className="text-white flex flex-wrap gap-1">
                                    {file.aiTags?.slice(0, 2).map(t => <span key={t}>{t}</span>) || 'Movie'}
                                </div>
                            </div>
                        </div>

                        {/* Cast List */}
                        {file.cast && (
                            <div>
                                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Cast</h3>
                                <div className="space-y-3">
                                    {file.cast.map((actor, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden shrink-0">
                                                {actor.avatar ? (
                                                    <img src={getAuthUrl(actor.avatar)} alt={actor.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-600"><UserIcon size={16} /></div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm text-white font-medium truncate">{actor.name}</div>
                                                <div className="text-xs text-zinc-500 truncate">{actor.role}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};