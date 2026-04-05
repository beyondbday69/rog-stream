import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../services/api';
import { LoaderCircle, AlertTriangle, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const RegionalWatch: React.FC = () => {
    const { episodeId, slug, serverIndex } = useParams<{ episodeId?: string, slug?: string, serverIndex?: string }>();
    const navigate = useNavigate();

    // If slug and serverIndex are present, it's a movie
    const isMovie = !!slug && !!serverIndex;

    const { data: episodeResponse, isLoading: isEpLoading, isError: isEpError, error: epError } = useApi<any>(
        isMovie ? '' : `https://animesalt-api-lovat.vercel.app/api/episode/${episodeId}`,
        { enabled: !isMovie && !!episodeId }
    );

    const { data: animeResponse, isLoading: isAnimeLoading, isError: isAnimeError, error: animeError } = useApi<any>(
        isMovie ? `https://animesalt-api-lovat.vercel.app/api/anime/${slug}` : '',
        { enabled: isMovie && !!slug }
    );

    const isLoading = isMovie ? isAnimeLoading : isEpLoading;
    const isError = isMovie ? isAnimeError : isEpError;
    const error = isMovie ? animeError : epError;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-brand-400 gap-4">
                <LoaderCircle className="w-16 h-16 animate-spin" />
                <span className="font-bold text-sm tracking-widest uppercase">Loading Stream...</span>
            </div>
        );
    }

    if (isError || (!isMovie && !episodeResponse) || (isMovie && !animeResponse)) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-6">
                <AlertTriangle className="w-20 h-20 text-red-500 opacity-50" />
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">Error</h1>
                    <p className="text-zinc-500 text-sm">{error?.message || "Stream data not found."}</p>
                </div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-6 py-3 bg-dark-800 border border-dark-600 hover:bg-white hover:text-black transition-all text-sm font-bold uppercase tracking-wider -skew-x-12"
                >
                    <span className="skew-x-12">Go Back</span>
                </button>
            </div>
        );
    }

    const playerUrl = isMovie 
        ? animeResponse?.movie_players?.[Number(serverIndex)] 
        : episodeResponse?.video_player;

    const title = isMovie 
        ? `${animeResponse?.title} - Server ${Number(serverIndex) + 1}`
        : episodeId;

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
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-brand-400 uppercase tracking-widest hover:text-white mb-1"
                        >
                            <ChevronLeft className="w-3 h-3" /> Go Back
                        </button>
                        <h1 className="text-lg md:text-3xl font-bold tracking-tight text-white uppercase italic truncate max-w-2xl leading-tight">
                            {title}
                        </h1>
                    </div>
                </div>

                {/* Player Container */}
                <div className="w-full aspect-video bg-black border border-white/10 rounded-sm overflow-hidden relative shadow-2xl">
                    {playerUrl ? (
                        <iframe 
                            src={playerUrl} 
                            className="w-full h-full border-none"
                            allowFullScreen
                            title="Player"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono text-sm">
                            No player available
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
