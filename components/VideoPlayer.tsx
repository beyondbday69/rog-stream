import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Server, Languages, Info, AlertTriangle, LoaderCircle } from 'lucide-react';
import { Episode } from '../types';

interface VideoPlayerProps {
  episodeId: string;
  currentEp: Episode;
  changeEpisode: (direction: 'prev' | 'next') => void;
  hasNextEp: boolean;
  hasPrevEp: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  episodeId,
  currentEp,
  changeEpisode,
  hasNextEp,
  hasPrevEp,
}) => {
  // Persist player settings (sub/dub, server) in localStorage
  const [category, setCategory] = useState<'sub' | 'dub'>(() => {
    return (localStorage.getItem('video_category') as 'sub' | 'dub') || 'sub';
  });
  const [server, setServer] = useState<'vidWish' | 'megaPlay'>(() => {
    return (localStorage.getItem('video_server') as 'vidWish' | 'megaPlay') || 'megaPlay';
  });
  const [isSkipping, setIsSkipping] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Fetch video from AnimeSalt API
  useEffect(() => {
    const fetchVideo = async () => {
      setIsLoadingVideo(true);
      setVideoError(null);
      try {
        const res = await fetch(`https://animesalt-api-lovat.vercel.app/api/episode/${episodeId}`);
        const result = await res.json();
        if (result && result.success && result.data && result.data.video_player) {
          setVideoSrc(result.data.video_player);
        } else {
          setVideoError("Video source not found.");
        }
      } catch (err) {
        console.error("Failed to fetch video:", err);
        setVideoError("Failed to load video source.");
      } finally {
        setIsLoadingVideo(false);
      }
    };
    if (episodeId) fetchVideo();
  }, [episodeId]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('video_category', category);
  }, [category]);

  useEffect(() => {
    localStorage.setItem('video_server', server);
  }, [server]);

  const handleSkipToNext = () => {
    if (hasNextEp) {
      setIsSkipping(true);
      setTimeout(() => {
        changeEpisode('next');
        setIsSkipping(false);
      }, 5000);
    }
  };

  // Default layout classes
  const containerClass = "flex flex-col gap-0 w-full relative group";
  const playerClass = "relative w-full aspect-video bg-black border border-dark-700 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden z-10 flex items-center justify-center";

  return (
    <div className={containerClass}>
      <div className={playerClass}>
        {isLoadingVideo ? (
          <div className="flex flex-col items-center justify-center text-zinc-500 gap-3">
            <LoaderCircle className="w-8 h-8 animate-spin text-brand-400" />
            <span className="text-xs uppercase tracking-widest font-bold">Loading Player...</span>
          </div>
        ) : videoError ? (
          <div className="flex flex-col items-center justify-center text-red-500 gap-3">
            <AlertTriangle className="w-8 h-8" />
            <span className="text-xs uppercase tracking-widest font-bold">{videoError}</span>
          </div>
        ) : (
          <iframe
            key={`${episodeId}`}
            src={videoSrc || ""}
            className="w-full h-full"
            allowFullScreen
            scrolling="no"
            frameBorder="0"
            allow="autoplay; fullscreen"
            title="Anime Stream"
          ></iframe>
        )}
      </div>

      <div className="bg-dark-900 border-x border-b border-dark-700 p-3 md:p-6 flex flex-col gap-4 md:gap-6 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImgridIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gNDAgMCBMIDAgMCAwIDQwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjQ2LDE5NSw2NywwLjAzKSIiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz48L3N2Zz4=')] opacity-50 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto opacity-50 pointer-events-none">
             {/* Server and Audio controls disabled since AnimeSalt player handles them or doesn't expose them directly here */}
             <div className="flex flex-col gap-1.5 flex-1 md:flex-none min-w-[140px]">
                 <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Server className="w-3 h-3" /> Server</span>
                 <div className="flex bg-dark-950 p-1 rounded-sm border border-dark-700">
                    <button className="flex-1 px-3 py-1.5 text-[10px] md:text-xs font-bold uppercase transition-all rounded-sm bg-brand-400 text-black">Auto</button>
                 </div>
             </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2 border-t border-dark-700 pt-3 md:border-0 md:pt-0">
             <span className="md:hidden text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Navigation</span>
             <div className="flex gap-2">
                <button onClick={() => changeEpisode("prev")} disabled={!hasPrevEp} className="group px-3 py-2 bg-dark-800 border border-dark-600 text-zinc-400 hover:text-white hover:border-brand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all -skew-x-12" title="Previous Episode"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5 skew-x-12" /></button>
                <button onClick={() => changeEpisode("next")} disabled={!hasNextEp} className="group px-3 py-2 bg-dark-800 border border-dark-600 text-zinc-400 hover:text-white hover:border-brand-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all -skew-x-12" title="Next Episode"><ChevronRight className="w-4 h-4 md:w-5 md:h-5 skew-x-12" /></button>
                {hasNextEp && (
                  <button 
                    onClick={handleSkipToNext} 
                    disabled={isSkipping}
                    className="group px-3 py-2 bg-red-900/20 border border-red-700 text-red-400 hover:text-white hover:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all -skew-x-12" 
                    title="Skip to Next Episode on Error"
                  >
                    <span className="skew-x-12 text-[10px] uppercase font-bold">{isSkipping ? "Skipping..." : "Error? Skip"}</span>
                  </button>
                )}
             </div>
          </div>
        </div>

        <div className="relative z-10 pt-3 md:pt-4 border-t border-dark-700 flex justify-between items-center text-[10px] md:text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-400"><Info className="w-3.5 h-3.5 md:w-4 md:h-4 text-brand-400" /><span className="hidden md:inline">PLAYING: </span><span className="text-white font-bold">EP {currentEp.number}</span></div>
            {currentEp.isFiller && (<span className="flex items-center gap-2 text-red-500 font-bold uppercase tracking-wider bg-red-500/10 px-2 py-0.5 border border-red-500/20 rounded-sm"><AlertTriangle className="w-3 h-3" /> Filler</span>)}
        </div>
      </div>
    </div>
  );
};