import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi, constructUrl } from '../services/api';
import { AnimeDetail, Episode, HistoryItem, Anime } from '../types';
import { LoaderCircle, AlertTriangle, ChevronLeft, Play, X, Grid2X2, List, Search, LayoutTemplate, ShieldCheck } from 'lucide-react';
import { VideoPlayer } from '../components/VideoPlayer';
import { AnimeCard } from '../components/AnimeCard';
import { useAuth } from '../context/AuthContext';
import { saveUserHistory, saveAnimeProgress } from '../services/firebase';
import { motion } from 'framer-motion';

export const Watch: React.FC = () => {
  const { animeId, episodeNumber } = useParams<{ animeId: string, episodeNumber: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [epSearch, setEpSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [duration, setDuration] = useState<number | null>(null);

  // Redirect if params are missing (prevent being stuck in loading/error states)
  useEffect(() => {
    if (!animeId || !episodeNumber) {
      navigate('/');
    }
  }, [animeId, episodeNumber, navigate]);

  const { data: rawAnime, isLoading: isAnimeLoading, error: animeError } = useApi<any>(
      animeId ? constructUrl('details', { id: animeId }) : ''
  );

  const { data: rawEpisodes, isLoading: isEpisodesLoading, error: episodesError } = useApi<any>(
      animeId ? constructUrl('episodes', { id: animeId }) : ''
  );

  const isLoading = isAnimeLoading || isEpisodesLoading;
  const error = animeError || episodesError;

  const animeData = React.useMemo(() => {
    if (!rawAnime) return null;
    
    return {
      ...rawAnime,
      id: rawAnime.anime?.info?.id || rawAnime.info?.id || rawAnime.id,
      title: rawAnime.anime?.info?.name || rawAnime.info?.name || rawAnime.title,
      image: rawAnime.anime?.info?.poster || rawAnime.anime?.info?.img || rawAnime.info?.img || rawAnime.image,
      banner: rawAnime.anime?.info?.poster || rawAnime.anime?.info?.img || rawAnime.info?.img || rawAnime.banner || rawAnime.image,
      description: rawAnime.anime?.info?.description || rawAnime.info?.description || rawAnime.description,
      totalEpisodes: rawEpisodes?.totalEpisodes || rawAnime.anime?.info?.stats?.episodes?.eps || rawAnime.info?.episodes?.eps || rawAnime.totalEpisodes,
      malID: rawAnime.anime?.info?.mal_id || rawAnime.info?.mal_id || rawAnime.malID,
      malScore: rawAnime.anime?.moreInfo?.['MAL Score'] || rawAnime.moreInfo?.['MAL Score:'] || rawAnime.malScore,
      genres: rawAnime.anime?.moreInfo?.Genres || rawAnime.moreInfo?.Genres || rawAnime.genres,
      status: rawAnime.anime?.moreInfo?.Status || rawAnime.moreInfo?.['Status:'] || rawAnime.status,
      relatedAnime: rawAnime.relatedAnimes || rawAnime.relatedAnime || [],
      recommendations: rawAnime.recommendedAnimes || rawAnime.recommendations || [],
      episodes: (rawEpisodes?.episodes || (Array.isArray(rawAnime.episodes) ? rawAnime.episodes : [])).map((ep: any) => ({
          ...ep,
          id: ep.episodeId || ep.id,
          number: ep.episodeNo || ep.number,
          title: ep.name || ep.title,
          isFiller: ep.filler || ep.isFiller
      }))
    };
  }, [rawAnime, rawEpisodes]);

  useEffect(() => {
    if (animeData && animeData.malID) {
        fetch(`https://api.jikan.moe/v4/anime/${animeData.malID}`)
            .then(res => res.json())
            .then(data => {
                if (data.data && data.data.duration) {
                    const match = data.data.duration.match(/(\d+)/);
                    if (match) {
                        setDuration(parseInt(match[1]) * 60 * 1000);
                    }
                }
            })
            .catch(err => console.error("Failed to fetch duration", err));
    }
  }, [animeData?.malID]); // Only re-run if malID changes

  useEffect(() => {
    const saveProgress = async () => {
        if (animeData && episodeNumber && user) {
            const episodes = animeData.episodes || [];
            const currentEp = episodes.find((e: Episode) => e.number?.toString() === episodeNumber);
            
            if (currentEp) {
                const historyItem: HistoryItem = {
                    animeId: animeId || '',
                    episodeId: currentEp.id,
                    title: animeData.title,
                    episodeNumber: currentEp.number,
                    image: animeData.banner || animeData.image || animeData.poster || '',
                    timestamp: Date.now()
                };

                try {
                  await saveUserHistory(user.uid, historyItem);
                  await saveAnimeProgress(user.uid, animeData, currentEp);
                } catch (error) {
                  console.error("Failed to save user progress to the cloud:", error);
                }
            }
        }
    };
    saveProgress();
  }, [animeData?.id, episodeNumber, animeId, user]);
  
  // Scroll to top on new episode
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [episodeNumber]);


  if (isLoading) {
    return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-brand-400 gap-4">
            <LoaderCircle className="w-16 h-16 animate-spin" />
            <span className="font-bold text-sm tracking-widest uppercase">Loading Stream...</span>
        </div>
    );
  }

  if (error || !animeData || !animeData.episodes) {
      return (
        <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-6">
            <AlertTriangle className="w-20 h-20 text-red-500 opacity-50" />
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Error</h1>
                <p className="text-zinc-500 text-sm">Episode data not found.</p>
                <p className="text-zinc-700 text-xs font-mono mt-2">ID: {animeId}</p>
            </div>
            <button 
                onClick={() => navigate('/')} 
                className="px-6 py-3 bg-dark-800 border border-dark-600 hover:bg-white hover:text-black transition-all text-sm font-bold uppercase tracking-wider -skew-x-12"
            >
                <span className="skew-x-12">Go Back</span>
            </button>
        </div>
      );
  }

  const episodes = animeData.episodes || [];
  const currentEpIndex = episodes.findIndex((e: Episode) => e.number?.toString() === episodeNumber);
  const currentEp = episodes[currentEpIndex];
  
  const prevEp = episodes[currentEpIndex - 1];
  const nextEp = episodes[currentEpIndex + 1];

  const handleNavigate = (direction: 'prev' | 'next') => {
      if (direction === 'prev' && prevEp) {
          navigate(`/watch/${animeId}/${prevEp.number}`);
      } else if (direction === 'next' && nextEp) {
          navigate(`/watch/${animeId}/${nextEp.number}`);
      }
  };

  useEffect(() => {
    if (duration && nextEp) {
        const timer = setTimeout(() => {
            handleNavigate('next');
        }, duration - 5000); // Trigger 5 seconds before end
        return () => clearTimeout(timer);
    }
  }, [duration, nextEp, episodeNumber]);

  const filteredEpisodes = episodes.filter((ep: Episode) => 
      ep.number?.toString().includes(epSearch) || 
      (ep.title && ep.title.toLowerCase().includes(epSearch.toLowerCase()))
  );

  if (!currentEp) {
      return (
          <div className="min-h-screen bg-dark-950 flex items-center justify-center text-white flex-col gap-4">
              <p>Episode ID not found in current list.</p>
              <button onClick={() => navigate(`/anime/${animeId}`)} className="text-brand-400 hover:underline">Return to Details</button>
          </div>
      );
  }

  const recommendations = [...(animeData.relatedAnime || []), ...(animeData.recommendations || [])];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-dark-950 pt-16 md:pt-24 pb-12 text-zinc-200 relative"
    >
      <div className="max-w-[1800px] mx-auto w-full px-2 md:px-6">
        
        {/* Header Navigation - Mobile optimized */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-2 border-b border-dark-700 pb-2 md:pb-4">
             <div>
                <button 
                    onClick={() => navigate(`/anime/${animeId}`)}
                    className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-brand-400 uppercase tracking-widest hover:text-white mb-1"
                >
                    <ChevronLeft className="w-3 h-3" /> Back to Anime
                </button>
                <h1 className="text-lg md:text-3xl font-bold tracking-tight text-white uppercase italic truncate max-w-2xl leading-tight">
                    {currentEp.title || `Episode ${currentEp.number}`}
                </h1>
                <p className="text-zinc-500 text-[10px] md:text-xs font-mono">
                    {animeData.title}
                </p>
             </div>
             <div className="flex items-center gap-2 self-end md:self-auto">
                 <div 
                    className="flex items-center gap-1.5 md:gap-2 px-2 py-1 bg-brand-400/10 border border-brand-400/30 rounded-sm" 
                    title="Ad & Redirect Shield is Always ON"
                 >
                     <ShieldCheck className="w-3 h-3 md:w-3.5 md:h-3.5 text-brand-400" />
                     <span className="text-brand-400 text-[8px] md:text-[9px] font-bold uppercase tracking-widest hidden sm:block">No Redirects</span>
                     <div className="w-5 h-2.5 md:w-6 md:h-3 bg-brand-400/30 rounded-full relative flex items-center ml-1">
                         <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-brand-400 rounded-full absolute right-0 shadow-[0_0_5px_rgba(255,0,51,0.8)]"></div>
                     </div>
                 </div>
                 <span className="text-green-500 text-[9px] md:text-[10px] font-bold uppercase border border-green-500/30 px-2 py-1 bg-green-500/10 rounded-sm">
                    ONLINE
                 </span>
             </div>
        </div>

        {/* Layout Container */}
        <div className="flex flex-col gap-6 lg:gap-8">
            
            {/* Top Section: Player & List */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                
                {/* Left Column: Video Player */}
                <div className="flex-1 min-w-0">
                    <VideoPlayer 
                        key={episodeNumber}
                        episodeId={currentEp.id}
                        currentEp={currentEp}
                        changeEpisode={handleNavigate}
                        hasPrevEp={!!prevEp}
                        hasNextEp={!!nextEp}
                    />
                </div>

                {/* Right Column: Episode List */}
                <div className="w-full lg:w-[400px] flex-shrink-0">
                     <div className="bg-dark-900 border border-dark-700 flex flex-col rounded-sm overflow-hidden h-[450px] md:h-[600px] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24 shadow-2xl">
                         
                         {/* List Header */}
                         <div className="p-3 md:p-4 bg-dark-800 border-b border-dark-700 space-y-3">
                             <div className="flex justify-between items-center">
                                 <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                    <List className="w-4 h-4 text-brand-400" /> Episodes
                                 </h3>
                                 <div className="flex items-center gap-2">
                                     {/* View Toggles */}
                                     <div className="flex bg-dark-950 rounded-sm border border-dark-700 p-0.5">
                                        <button 
                                            onClick={() => setViewMode('list')}
                                            className={`p-1 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-brand-400 text-black' : 'text-zinc-500 hover:text-white'}`}
                                            title="List View"
                                        >
                                            <List className="w-3.5 h-3.5" />
                                        </button>
                                        <button 
                                            onClick={() => setViewMode('grid')}
                                            className={`p-1 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-brand-400 text-black' : 'text-zinc-500 hover:text-white'}`}
                                            title="Grid View"
                                        >
                                            <Grid2X2 className="w-3.5 h-3.5" />
                                        </button>
                                     </div>
                                     <span className="text-[10px] font-mono text-zinc-500 bg-black/50 px-2 py-1 rounded border border-white/5">
                                         {episodes.length}
                                     </span>
                                 </div>
                             </div>
                             {/* Search Box */}
                             <div className="relative">
                                 <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                                 <input 
                                    type="text"
                                    placeholder="Search episode number..."
                                    value={epSearch}
                                    onChange={(e) => setEpSearch(e.target.value)}
                                    className="w-full bg-dark-950 border border-dark-600 rounded-sm py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:border-brand-400 focus:outline-none"
                                 />
                             </div>
                         </div>
                         
                         {/* List Content */}
                         <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-brand-400/20 scrollbar-track-dark-900 p-2">
                            {filteredEpisodes.length > 0 ? (
                                viewMode === 'list' ? (
                                    // List View
                                    <div className="space-y-1">
                                        {filteredEpisodes.map((ep: Episode) => {
                                            const isActive = ep.number.toString() === episodeNumber;
                                            return (
                                                <Link 
                                                    key={ep.id}
                                                    to={`/watch/${animeId}/${ep.number}`}
                                                    className={`flex items-center gap-3 p-2 md:p-3 rounded-sm group transition-all duration-200 border-l-2 ${
                                                        isActive 
                                                        ? 'bg-brand-400/10 border-brand-400' 
                                                        : 'bg-transparent border-transparent hover:bg-dark-800 hover:border-dark-600'
                                                    }`}
                                                >
                                                    <div className={`w-8 h-6 md:w-10 md:h-8 flex items-center justify-center rounded-sm font-mono text-xs md:text-sm font-bold ${
                                                        isActive ? 'bg-brand-400 text-black' : 'bg-dark-800 text-zinc-500 group-hover:text-white'
                                                    }`}>
                                                        {ep.number}
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-xs font-bold truncate ${
                                                            isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                                                        }`}>
                                                            {ep.title || `Episode ${ep.number}`}
                                                        </div>
                                                    </div>
        
                                                    {ep.isFiller && (
                                                        <span className="text-[9px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 uppercase font-bold tracking-wider">
                                                            Filler
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    // Grid View
                                    <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                        {filteredEpisodes.map((ep: Episode) => {
                                            const isActive = ep.number.toString() === episodeNumber;
                                            return (
                                                <Link 
                                                    key={ep.id}
                                                    to={`/watch/${animeId}/${ep.number}`}
                                                    className={`aspect-square flex flex-col items-center justify-center rounded-sm border transition-all duration-200 ${
                                                        isActive 
                                                        ? 'bg-brand-400 text-black border-brand-400 font-bold' 
                                                        : 'bg-dark-800 text-zinc-400 border-dark-600 hover:text-white hover:border-zinc-500'
                                                    }`}
                                                >
                                                    <span className="text-sm font-mono">{ep.number}</span>
                                                    {ep.isFiller && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1" title="Filler"></span>}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8 text-center">
                                    <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-xs uppercase font-bold">No episodes found</p>
                                </div>
                            )}
                         </div>
                     </div>
                </div>
            </div>

            {/* Bottom Section: Recommendations */}
            {recommendations.length > 0 && (
                <div className="pt-6 border-t border-dark-700">
                    <h2 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter mb-4 md:mb-6 border-l-4 border-zinc-600 pl-4">
                        Recommended <span className="text-brand-400">Data</span>
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                        {recommendations.slice(0, 10).map((rel: Anime) => (
                            <AnimeCard key={rel.id} anime={rel} layout="grid" />
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </motion.div>
  );
}