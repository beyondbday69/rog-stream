import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../services/api';
import { LoaderCircle, AlertTriangle, ChevronLeft, List, Grid2X2, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const RegionalWatch: React.FC = () => {
    const { animeId, episodeNumber } = useParams<{ animeId: string, episodeNumber: string }>();
    const navigate = useNavigate();
    const [epSearch, setEpSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    
    // Fetch Anime Details for the sidebar
    const { data: animeData, isLoading: isAnimeLoading, isError: isAnimeError, error: animeError } = useApi<any>(
        `https://animesalt-api-lovat.vercel.app/api/anime/${animeId}`
    );

    // Fetch Video Source if it's an episode
    const isMovie = episodeNumber === 'movie';
    const { data: epData, isLoading: isEpLoading, isError: isEpError, error: epError } = useApi<any>(
        `https://animesalt-api-lovat.vercel.app/api/episode/${episodeNumber}`,
        { enabled: !isMovie }
    );

    const isLoading = isAnimeLoading || (isEpLoading && !isMovie);
    const isError = isAnimeError || (isEpError && !isMovie);
    const error = animeError || epError;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-brand-400 gap-4">
                <LoaderCircle className="w-16 h-16 animate-spin" />
                <span className="font-bold text-sm tracking-widest uppercase">Loading Stream...</span>
            </div>
        );
    }

    if (isError || !animeData || Object.keys(animeData).length === 0) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-6">
                <AlertTriangle className="w-20 h-20 text-red-500 opacity-50" />
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Error</h1>
                    <p className="text-zinc-500 text-sm">{error?.message || "Episode data not found."}</p>
                </div>
                <button 
                    onClick={() => navigate(`/regional/anime/${animeId}`)} 
                    className="px-6 py-3 bg-dark-800 border border-dark-600 hover:bg-white hover:text-black transition-all text-sm font-bold uppercase tracking-wider -skew-x-12"
                >
                    <span className="skew-x-12">Back to Anime</span>
                </button>
            </div>
        );
    }

    const anime = animeData;
    const episodes = anime.episodes || [];
    
    const filteredEpisodes = episodes.filter((ep: any) => 
        ep.number.toString().includes(epSearch) || 
        (ep.title && ep.title.toLowerCase().includes(epSearch.toLowerCase()))
    );

    let videoUrl = "";
    if (isMovie) {
        videoUrl = anime.movie_players && anime.movie_players.length > 0 ? anime.movie_players[0] : "";
    } else {
        videoUrl = epData?.video_player || "";
    }

    const currentEpTitle = isMovie ? anime.title : (episodes.find((e: any) => e.id === episodeNumber)?.title || `Episode ${episodeNumber}`);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-dark-950 pt-16 md:pt-24 pb-12 text-zinc-200 relative"
        >
            <div className="max-w-[1800px] mx-auto w-full px-2 md:px-6">
                
                {/* Header Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-2 border-b border-dark-700 pb-2 md:pb-4">
                    <div>
                        <button 
                            onClick={() => navigate(`/regional/anime/${animeId}`)}
                            className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-brand-400 uppercase tracking-widest hover:text-white mb-1"
                        >
                            <ChevronLeft className="w-3 h-3" /> Back to Anime
                        </button>
                        <h1 className="text-lg md:text-3xl font-bold tracking-tight text-white uppercase italic truncate max-w-2xl leading-tight">
                            {currentEpTitle}
                        </h1>
                        <p className="text-zinc-500 text-[10px] md:text-xs font-mono">
                            {anime.title}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 self-end md:self-auto">
                        <span className="text-brand-400 text-[9px] md:text-[10px] font-bold uppercase border border-brand-400/30 px-2 py-1 bg-brand-400/10 rounded-sm">
                            REGIONAL
                        </span>
                    </div>
                </div>

                {/* Layout Container */}
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                    
                    {/* Left Column: Video Player & Servers */}
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                        
                        {/* Player Container */}
                        <div className="w-full aspect-video bg-black border border-white/10 rounded-sm overflow-hidden relative shadow-2xl">
                            {videoUrl ? (
                                <iframe 
                                    src={videoUrl} 
                                    className="w-full h-full border-none"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono text-sm">
                                    No video source found for this {isMovie ? 'movie' : 'episode'}.
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Episode List */}
                    {!isMovie && (
                    <div className="w-full lg:w-[400px] flex-shrink-0">
                        <div className="bg-dark-900 border border-dark-700 flex flex-col rounded-sm overflow-hidden h-[450px] md:h-[600px] lg:h-[calc(100vh-140px)] lg:sticky lg:top-24 shadow-2xl">
                            
                            {/* List Header */}
                            <div className="p-3 md:p-4 bg-dark-800 border-b border-dark-700 space-y-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                                        <List className="w-4 h-4 text-brand-400" /> Episodes
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="flex bg-dark-950 rounded-sm border border-dark-700 p-0.5">
                                            <button 
                                                onClick={() => setViewMode('list')}
                                                className={`p-1 rounded-sm transition-colors ${viewMode === 'list' ? 'bg-brand-400 text-black' : 'text-zinc-500 hover:text-white'}`}
                                            >
                                                <List className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                                onClick={() => setViewMode('grid')}
                                                className={`p-1 rounded-sm transition-colors ${viewMode === 'grid' ? 'bg-brand-400 text-black' : 'text-zinc-500 hover:text-white'}`}
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
                                        placeholder="Search episode..."
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
                                        <div className="space-y-1">
                                            {filteredEpisodes.map((ep: any) => {
                                                const isActive = ep.id === episodeNumber;
                                                return (
                                                    <Link 
                                                        key={ep.id}
                                                        to={`/regional/watch/${animeId}/${ep.id}`}
                                                        className={`flex items-center gap-2 p-1.5 rounded-sm group transition-all duration-200 border-l-2 ${
                                                            isActive 
                                                            ? 'bg-brand-400/10 border-brand-400' 
                                                            : 'bg-transparent border-transparent hover:bg-dark-800 hover:border-dark-600'
                                                        }`}
                                                    >
                                                        <div className={`w-6 h-5 flex items-center justify-center rounded-sm font-mono text-[10px] font-bold ${
                                                            isActive ? 'bg-brand-400 text-black' : 'bg-dark-800 text-zinc-500 group-hover:text-white'
                                                        }`}>
                                                            {ep.number}
                                                        </div>
                                                        
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-[10px] font-bold truncate ${
                                                                isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                                                            }`}>
                                                                {ep.title || `Episode ${ep.number}`}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                            {filteredEpisodes.map((ep: any) => {
                                                const isActive = ep.id === episodeNumber;
                                                return (
                                                    <Link 
                                                        key={ep.id}
                                                        to={`/regional/watch/${animeId}/${ep.id}`}
                                                        className={`aspect-square flex flex-col items-center justify-center rounded-sm border transition-all duration-200 ${
                                                            isActive 
                                                            ? 'bg-brand-400 text-black border-brand-400 font-bold' 
                                                            : 'bg-dark-800 text-zinc-400 border-dark-600 hover:text-white hover:border-zinc-500'
                                                        }`}
                                                    >
                                                        <span className="text-sm font-mono">{ep.number}</span>
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
                    )}
                </div>
            </div>
        </motion.div>
    );
};
