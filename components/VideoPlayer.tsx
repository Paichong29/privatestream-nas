import React, { useState, useEffect, useRef } from 'react';
import { MediaFile } from '../types';
import { Captions, Check, Maximize, Minimize, Play, Pause, Volume2, VolumeX, X, Settings, Info, Activity, Music } from 'lucide-react';

interface VideoPlayerProps {
  file: MediaFile;
  subtitles?: MediaFile[];
  onClose: () => void;
}

import { api } from '../services/api';

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ file, subtitles = [], onClose }) => {
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Menus
  const [activeMenu, setActiveMenu] = useState<'none' | 'subtitles' | 'settings' | 'audio'>('none');
  const [showStats, setShowStats] = useState(false);
  const [quality, setQuality] = useState('Direct Play');

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Helper: Convert SRT string to WebVTT string
  const srtToVtt = (srt: string): string => {
    const vttBody = srt
      .replace(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/g, '$1:$2:$3.$4')
      .replace(/\r\n|\r|\n/g, '\n');
    return `WEBVTT\n\n${vttBody}`;
  };

  // Attempt to auto-match subtitle by filename on mount
  useEffect(() => {
    const videoNameBase = file.name.substring(0, file.name.lastIndexOf('.'));
    const match = subtitles.find(s => s.name.startsWith(videoNameBase));
    if (match) {
      setSelectedSubtitleId(match.id);
    }
  }, [file, subtitles]);

  // Load and process subtitle when selection changes
  useEffect(() => {
    if (!selectedSubtitleId) {
      setTrackUrl(null);
      return;
    }

    const subFile = subtitles.find(s => s.id === selectedSubtitleId);
    if (!subFile) return;

    const loadSubtitle = async () => {
      try {
        const response = await fetch(subFile.url);
        const text = await response.text();

        let vttText = text;
        if (subFile.name.toLowerCase().endsWith('.srt')) {
          vttText = srtToVtt(text);
        }

        const blob = new Blob([vttText], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);
        setTrackUrl(url);
      } catch (err) {
        console.error("Failed to load subtitle", err);
      }
    };

    loadSubtitle();
    return () => {
      if (trackUrl) URL.revokeObjectURL(trackUrl);
    };
  }, [selectedSubtitleId, subtitles]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (isFullscreen) toggleFullscreen();
        else onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying && activeMenu === 'none') setShowControls(false);
    }, 2500);
  };

  // Click outside menu to close
  useEffect(() => {
    const handleClick = () => setActiveMenu('none');
    if (activeMenu !== 'none') {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [activeMenu]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-black relative group font-sans select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && activeMenu === 'none' && setShowControls(false)}
    >
      {/* Video Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          src={`${file.url}?token=${api.getToken()}`}
          className="max-h-full max-w-full w-auto h-auto shadow-2xl outline-none"
          crossOrigin="anonymous"
          onClick={togglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          {trackUrl && (
            <track
              label="English"
              kind="subtitles"
              srcLang="en"
              src={trackUrl}
              default
            />
          )}
        </video>

        {/* Stats for Nerds Overlay */}
        {showStats && (
          <div className="absolute top-4 left-4 bg-black/80 p-4 rounded-lg text-xs font-mono text-green-400 border border-green-900/30 backdrop-blur-md z-30 shadow-xl max-w-sm pointer-events-none">
            <h4 className="font-bold mb-2 text-white border-b border-gray-700 pb-1">Stream Info</h4>
            <div className="grid grid-cols-[80px_1fr] gap-1">
              <span className="text-gray-400">Resolution:</span>
              <span>{file.metadata?.resolution || 'N/A'}</span>
              <span className="text-gray-400">Video:</span>
              <span>{file.metadata?.codec || 'N/A'}</span>
              <span className="text-gray-400">Audio:</span>
              <span>{file.metadata?.audioCodec || 'N/A'}</span>
              <span className="text-gray-400">Bitrate:</span>
              <span>{file.metadata?.bitrate || 'N/A'}</span>
              <span className="text-gray-400">Container:</span>
              <span>{file.metadata?.container || 'N/A'}</span>
              <span className="text-gray-400">Dropped:</span>
              <span>
                {videoRef.current
                  ? `${(videoRef.current as any).webkitDroppedFrameCount || (videoRef.current as any).mozDecodedFrames - (videoRef.current as any).mozPresentedFrames || 0}`
                  : '0'}
              </span>
            </div>
          </div>
        )}

        {/* Custom Overlay Controls */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 transition-opacity duration-300 flex flex-col justify-between p-6 pointer-events-none ${showControls ? 'opacity-100' : 'opacity-0'}`}>

          {/* Top Bar */}
          <div className="flex justify-between items-start pointer-events-auto">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-white drop-shadow-md">{file.name}</h2>
                {file.metadata?.resolution === '4K' && (
                  <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold border border-yellow-500/30">4K HDR</span>
                )}
                {file.storageLocation === 'CLOUD' && (
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">CLOUD STREAM</span>
                )}
              </div>
              {file.aiTags && (
                <div className="flex gap-2 mt-1">
                  {file.aiTags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-white/10 px-2 py-0.5 rounded text-zinc-300 backdrop-blur-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center gap-4 pointer-events-auto">
            <button onClick={togglePlay} className="p-3 bg-white hover:bg-indigo-50 rounded-full text-black transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>

            <button onClick={toggleMute} className="p-2 text-white hover:text-indigo-400 transition-colors">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Progress Bar */}
            <div className="flex-1 h-1 bg-white/20 rounded-full mx-4 cursor-pointer relative overflow-hidden group">
              <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-indigo-500 rounded-full group-hover:bg-indigo-400" />
            </div>

            {/* Settings Group */}
            <div className="flex items-center gap-2">

              {/* Audio Track Menu */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'audio' ? 'none' : 'audio'); }}
                  className={`p-2 rounded-lg transition-colors ${activeMenu === 'audio' ? 'text-indigo-400 bg-white/10' : 'text-zinc-300 hover:text-white hover:bg-white/10'}`}
                  title="Audio Tracks"
                >
                  <Music size={20} />
                </button>
                {activeMenu === 'audio' && (
                  <div className="absolute bottom-full right-0 mb-3 w-56 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-bottom-2 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="p-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Select Audio</div>
                    <div className="p-1">
                      {['English (AAC 5.1)', 'English (AC3 Stereo)', 'Japanese (FLAC 2.0)'].map((track, i) => (
                        <button key={i} onClick={() => setActiveMenu('none')} className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between text-zinc-300 hover:bg-white/10 hover:text-white">
                          <span>{track}</span>
                          {i === 0 && <Check size={14} className="text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Subtitle Menu */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'subtitles' ? 'none' : 'subtitles'); }}
                  className={`p-2 rounded-lg transition-colors ${activeMenu === 'subtitles' ? 'text-indigo-400 bg-white/10' : 'text-zinc-300 hover:text-white hover:bg-white/10'}`}
                  title="Subtitles"
                >
                  <Captions size={20} />
                </button>
                {activeMenu === 'subtitles' && (
                  <div className="absolute bottom-full right-0 mb-3 w-64 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-bottom-2 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="p-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Subtitles</div>
                    <div className="p-1 max-h-60 overflow-y-auto">
                      <button onClick={() => { setSelectedSubtitleId(null); setActiveMenu('none'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${!selectedSubtitleId ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
                        <span>Off</span>
                        {!selectedSubtitleId && <Check size={14} />}
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      {subtitles.map(sub => (
                        <button key={sub.id} onClick={() => { setSelectedSubtitleId(sub.id); setActiveMenu('none'); }} className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${selectedSubtitleId === sub.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}>
                          <span className="truncate pr-2">{sub.name}</span>
                          {selectedSubtitleId === sub.id && <Check size={14} />}
                        </button>
                      ))}
                      <div className="h-px bg-white/5 my-1" />
                      <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-zinc-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-2">
                        Search Online...
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Quality/Settings Menu */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'settings' ? 'none' : 'settings'); }}
                  className={`p-2 rounded-lg transition-colors ${activeMenu === 'settings' ? 'text-indigo-400 bg-white/10' : 'text-zinc-300 hover:text-white hover:bg-white/10'}`}
                >
                  <Settings size={20} />
                </button>
                {activeMenu === 'settings' && (
                  <div className="absolute bottom-full right-0 mb-3 w-64 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700 rounded-xl shadow-2xl overflow-hidden z-20 animate-in slide-in-from-bottom-2 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                    <div className="p-3 border-b border-zinc-800 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Playback Quality</div>
                    <div className="p-1">
                      {['Direct Play (Source)', '1080p (20 Mbps)', '720p (4 Mbps)', '480p (1.5 Mbps)'].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setQuality(q); setActiveMenu('none'); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between ${quality === q ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-white/10 hover:text-white'}`}
                        >
                          <span>{q}</span>
                          {quality === q && <Check size={14} />}
                        </button>
                      ))}
                      <div className="h-px bg-white/5 my-1" />
                      <button
                        onClick={() => { setShowStats(!showStats); setActiveMenu('none'); }}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                      >
                        <Activity size={14} />
                        <span>Stats for Nerds</span>
                        {showStats && <Check size={14} className="ml-auto text-indigo-400" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-px h-6 bg-white/20 mx-2" />

            <button onClick={toggleFullscreen} className="p-2 text-white hover:text-indigo-400 transition-colors">
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Info Section (Only visible when not fullscreen) */}
      {!isFullscreen && (
        <div className="p-6 bg-zinc-900 border-t border-zinc-800">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-white">{file.name}</h2>
                {file.isEncrypted && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Zero-Knowledge Encrypted
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-zinc-400 mb-4 items-center">
                <span className="px-2 py-0.5 bg-zinc-800 rounded border border-zinc-700">
                  {file.storageLocation === 'LOCAL' ? 'NVMe Storage' : 'Google Drive (Crypt)'}
                </span>
                <span>•</span>
                <span>{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                <span>•</span>
                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
              </div>
              {file.aiDescription && (
                <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800/50">
                  <p className="text-zinc-300 leading-relaxed max-w-4xl text-sm">{file.aiDescription}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
