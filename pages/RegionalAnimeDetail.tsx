import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../services/api';
import { Play, Star, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DetailSkeleton } from '../components/Skeletons';

export const RegionalAnimeDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [selectedSeason, setSelectedSeason] = useState("");
    const { data: response, isLoading, isError, error } = useApi<any>(`https://animesalt-api-lovat.vercel.app/api/anime/${id}`);

    const anime = response?.data;

    // Group episodes by season
    const episodesBySeason = React.useMemo(() => {
        if (!anime?.episodes) return {};
        return anime.episodes.reduce((acc: any, ep: any) => {
            const season = ep.season || "1";
            if (!acc[season]) acc[season] = [];
            acc[season].push(ep);
            return acc;
        }, {});
    }, [anime?.episodes]);

    const seasons = React.useMemo(() => Object.keys(episodesBySeason).sort((a, b) => Number(a) - Number(b)), [episodesBySeason]);

    // Update selected season when data loads
    React.useEffect(() => {
        if (seasons.length > 0 && (!selectedSeason || !seasons.includes(selectedSeason))) {
            setSelectedSeason(seasons[0]);
        }
    }, [seasons, selectedSeason]);

    if (isLoading) return <DetailSkeleton />;

    if (isError || !response || !response.success) {
        return (
            <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
                <AlertTriangle className="w-16 h-16 text-brand-400 mb-4 opacity-50" />
                <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Error Loading Anime</h2>
                <p className="text-zinc-500 font-mono text-sm">{error?.message || "Failed to load regional anime details"}</p>
                <Link to="/regional" className="mt-8 px-6 py-2 bg-brand-400 text-black font-bold uppercase tracking-widest text-xs rounded hover:bg-white transition-colors">
                    Back to Regional
                </Link>
            </div>
        );
    }

    const displayTitle = anime.title || 'Unknown Title';
    const displayPoster = anime.thumbnail || 'https://via.placeholder.com/400x600?text=No+Image';

    const currentEpisodes = episodesBySeason[selectedSeason] || (seasons.length > 0 ? episodesBySeason[seasons[0]] : []);

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-dark-950 pb-20"
        >
            {/* Hero Banner */}
            <div className="relative h-[40vh] md:h-[60vh] w-full">
                <div className="absolute inset-0 bg-dark-950">
                    <img 
                        src={displayPoster} 
                        alt={displayTitle}
                        className="w-full h-full object-cover opacity-40 blur-sm"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/80 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 max-w-[1600px] mx-auto px-4 md:px-8 pb-8 flex flex-col md:flex-row gap-6 md:gap-10 items-end">
                    {/* Poster */}
                    <div className="w-32 md:w-56 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl border border-white/10 relative z-10 hidden md:block">
                        <img 
                            src={displayPoster} 
                            alt={displayTitle}
                            className="w-full h-auto object-cover"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 relative z-10">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-2 md:mb-4 leading-tight font-display italic tracking-tighter">
                            {displayTitle}
                        </h1>
                        
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 mb-4 md:mb-6 text-xs md:text-sm font-bold uppercase tracking-widest">
                            <span className="px-2 py-1 bg-brand-400 text-black rounded-sm">Regional</span>
                            {anime.genres?.map((genre: string) => (
                                <span key={genre} className="text-zinc-300">{genre}</span>
                            ))}
                        </div>

                        <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-3xl line-clamp-3 md:line-clamp-none mb-6">
                            {anime.description || 'No description available.'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-8 md:mt-12">
                {anime.is_movie ? (
                    <div className="space-y-6">
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide font-display italic mb-6 border-l-4 border-brand-400 pl-4">
                            Movie Players
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {anime.movie_players?.map((player: string, idx: number) => (
                                <Link 
                                    key={idx}
                                    to={`/regional/movie/${id}/${idx}`}
                                    className="group flex gap-4 bg-dark-900 border border-white/5 hover:border-brand-400/50 rounded-sm overflow-hidden transition-all p-4 items-center"
                                >
                                    <div className="w-12 h-12 rounded-full bg-brand-400 flex items-center justify-center shadow-lg">
                                        <Play className="w-6 h-6 text-black fill-black ml-1" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors">
                                            Server {idx + 1}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : anime.episodes?.length > 0 ? (
                    <div className="space-y-6">
                        {/* Season Selector */}
                        {seasons.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {seasons.map((season: string) => (
                                    <button
                                        key={season}
                                        onClick={() => setSelectedSeason(season)}
                                        className={`px-4 py-2 text-sm font-bold uppercase tracking-widest rounded-sm transition-colors ${
                                            selectedSeason === season 
                                            ? 'bg-brand-400 text-black' 
                                            : 'bg-dark-900 text-zinc-400 hover:text-white hover:bg-dark-800 border border-white/10'
                                        }`}
                                    >
                                        Season {season}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Episodes for Selected Season */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {currentEpisodes.map((ep: any) => (
                                <Link 
                                    key={ep.id}
                                    to={`/regional/watch/${ep.id}`}
                                    className="group flex gap-4 bg-dark-900 border border-white/5 hover:border-brand-400/50 rounded-sm overflow-hidden transition-all"
                                >
                                    <div className="relative w-32 md:w-40 flex-shrink-0 aspect-video bg-dark-800">
                                        <img 
                                            src={ep.thumbnail || displayPoster} 
                                            alt={ep.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-8 h-8 rounded-full bg-brand-400 flex items-center justify-center shadow-lg">
                                                <Play className="w-4 h-4 text-black fill-black ml-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="py-3 pr-3 flex flex-col justify-center">
                                        <span className="text-brand-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                                            Episode {ep.number}
                                        </span>
                                        <h4 className="text-sm font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-2">
                                            {ep.title}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-zinc-500 font-mono text-sm">No content available for this anime.</p>
                )}
            </div>
        </motion.div>
    );
};
