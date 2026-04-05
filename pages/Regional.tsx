import React, { useState, useEffect } from 'react';
import { useApi } from '../services/api';
import { AnimeCard } from '../components/AnimeCard';
import { HomeSkeleton } from '../components/Skeletons';
import { AlertTriangle, Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Anime } from '../types';

const HorizontalSection: React.FC<{ title: string; items: Anime[]; variant?: 'portrait' | 'landscape'; link?: string; subtitle?: string; isRegional?: boolean }> = ({ 
    title, items, variant = 'portrait', link, subtitle, isRegional = false
}) => {
    if (!items || items.length === 0) return null;

    return (
        <section className="mb-8 md:mb-12 relative group">
            <div className="max-w-[1600px] mx-auto px-3 md:px-6">
                {/* Header */}
                <div className="flex items-end justify-between mb-3 md:mb-4 border-l-4 border-brand-400 pl-3 md:pl-4">
                    <div>
                        <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-wide font-display italic">
                            {title}
                        </h2>
                        {subtitle && <p className="text-brand-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>}
                    </div>
                </div>

                {/* Scroll Container */}
                <div className="relative -mx-3 md:-mx-6 px-3 md:px-6">
                    <div className="flex overflow-x-auto gap-3 md:gap-5 pb-4 scrollbar-hide snap-x">
                        {items.map((anime: Anime, idx: number) => (
                            <div key={anime.id} className="snap-start">
                                <AnimeCard anime={anime} variant={variant} layout="row" isRegional={isRegional} />
                            </div>
                        ))}
                    </div>
                    
                    {/* Fade Edges */}
                    <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-dark-950 to-transparent pointer-events-none md:hidden" />
                </div>
            </div>
        </section>
    );
};

export const Regional: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: homeData, isLoading: isHomeLoading, isError: isHomeError, error: homeError } = useApi<any>('https://animesalt-api-lovat.vercel.app/api/home', { enabled: !debouncedQuery });
    const { data: searchData, isLoading: isSearchLoading, isError: isSearchError, error: searchError } = useApi<any>(`https://animesalt-api-lovat.vercel.app/api/search?q=${encodeURIComponent(debouncedQuery)}`, { enabled: !!debouncedQuery });

    const isLoading = debouncedQuery ? isSearchLoading : isHomeLoading;
    const isError = debouncedQuery ? isSearchError : isHomeError;
    const error = debouncedQuery ? searchError : homeError;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="min-h-screen pt-24 pb-20 bg-dark-950"
        >
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-black text-white uppercase tracking-widest font-display italic">
                            Regional <span className="text-brand-400">Anime</span>
                        </h1>
                        <p className="text-zinc-500 font-mono text-sm mt-2">Hindi, Tamil, Telugu Dubbed Anime</p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-zinc-500" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-10 py-3 bg-dark-900 border border-white/10 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all font-mono text-sm"
                            placeholder="Search regional anime..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {isLoading && (
                    <div className="space-y-8 animate-pulse">
                        {[1, 2, 3].map((section) => (
                            <div key={section} className="mb-8 md:mb-12">
                                <div className="w-48 h-8 bg-dark-800 rounded-sm mb-4 border-l-4 border-dark-700"></div>
                                <div className="flex overflow-x-hidden gap-3 md:gap-5">
                                    {[1, 2, 3, 4, 5, 6, 7].map((card) => (
                                        <div key={card} className="w-[160px] md:w-[220px] aspect-[2/3] bg-dark-800 rounded-sm flex-shrink-0 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isError && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <AlertTriangle className="w-16 h-16 text-brand-400 mb-4 opacity-50" />
                        <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Error Loading Content</h2>
                        <p className="text-zinc-500 font-mono text-sm">{error?.message || "Failed to load regional content"}</p>
                    </div>
                )}

                {!isLoading && !isError && debouncedQuery && searchData?.results && (
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-l-4 border-brand-400 pl-3">
                            Search Results for "{debouncedQuery}"
                        </h2>
                        {searchData.results.length === 0 ? (
                            <p className="text-zinc-500 font-mono text-center py-10">No results found.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                                {searchData.results.map((item: any) => (
                                    <AnimeCard 
                                        key={item.slug}
                                        anime={{
                                            id: item.slug,
                                            title: item.title,
                                            image: item.image,
                                            banner: item.image,
                                            type: 'TV',
                                            episodes: { sub: 0, dub: 1, eps: 0 }
                                        } as Anime}
                                        layout="grid"
                                        isRegional={true}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && !isError && !debouncedQuery && homeData && Object.keys(homeData).length > 0 && (
                    <div className="space-y-4">
                        {Object.entries(homeData).map(([key, items]: [string, any], idx: number) => (
                            <HorizontalSection 
                                key={idx}
                                title={key.replace(/_/g, ' ').toUpperCase()}
                                isRegional={true}
                                items={Array.isArray(items) ? items.map((item: any) => ({
                                    id: item.slug,
                                    title: item.title,
                                    image: item.image,
                                    banner: item.image,
                                    type: 'TV',
                                    episodes: { sub: 0, dub: 1, eps: 0 }
                                } as Anime)) : []}
                            />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
