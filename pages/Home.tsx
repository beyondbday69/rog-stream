import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, constructUrl } from '../services/api';
import { HomeData, Anime } from '../types';
import { Hero } from '../components/Hero';
import { AnimeCard } from '../components/AnimeCard';
import { ContinueWatchingCard } from '../components/ContinueWatchingCard'; // New Component
import { HomeSkeleton, ContinueWatchingCardSkeleton } from '../components/Skeletons';
import { ChevronRight, AlertTriangle, LayoutTemplate } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProgress, UserProgress } from '../services/firebase';
import { motion } from 'framer-motion';

const HorizontalSection: React.FC<{ title: string; items: Anime[]; variant?: 'portrait' | 'landscape'; link?: string; subtitle?: string }> = ({ 
    title, items, variant = 'portrait', link, subtitle 
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
                    {link && (
                        <Link to={link} className="hidden md:flex items-center text-xs font-bold text-zinc-500 hover:text-brand-400 uppercase tracking-widest transition-colors">
                            View All <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    )}
                </div>

                {/* Scroll Container */}
                <div className="relative -mx-3 md:-mx-6 px-3 md:px-6">
                    <div className="flex overflow-x-auto gap-3 md:gap-5 pb-4 scrollbar-hide snap-x">
                        {items.map((anime: Anime, idx: number) => (
                            <div key={anime.id} className="snap-start">
                                <AnimeCard anime={anime} variant={variant} rank={subtitle === 'Global Top 10' ? idx + 1 : undefined} layout="row" />
                            </div>
                        ))}
                        
                        {/* View All Card at the end */}
                        {link && (
                             <div className="snap-start flex-shrink-0 w-[80px] md:w-[100px] flex items-center justify-center">
                                <Link to={link} className="w-10 h-10 md:w-12 md:h-12 rounded-none border border-white/20 flex items-center justify-center hover:bg-brand-400 hover:text-black hover:border-brand-400 transition-all skew-x-[-12deg]">
                                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 skew-x-[12deg]" />
                                </Link>
                             </div>
                        )}
                    </div>
                    
                    {/* Fade Edges */}
                    <div className="absolute top-0 right-0 bottom-4 w-12 bg-gradient-to-l from-dark-950 to-transparent pointer-events-none md:hidden" />
                </div>
            </div>
        </section>
    );
};

// Continue Watching based on Auth state
const ContinueWatchingSection: React.FC = () => {
    const [watching, setWatching] = useState<UserProgress[]>([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        const fetchProgress = async () => {
            setIsLoadingProgress(true);
            setError(null);
            if (authLoading) return;

            if (user) {
                try {
                    const data = await getUserProgress(user.uid);
                    const watchingList = Object.values(data)
                        .filter(p => p.status === 'Watching')
                        .sort((a, b) => b.lastUpdated - a.lastUpdated);
                    setWatching(watchingList);
                } catch (e: any) {
                    setError(e.message);
                }
            } else {
                setWatching([]);
            }
            setIsLoadingProgress(false);
        };

        fetchProgress();
    }, [user, authLoading]);

    if (authLoading) {
        return null; // Don't show anything until auth state is resolved
    }

    if (!user) {
        return null; // Hide if not logged in.
    }

    if (error) {
        return (
            <section className="mb-12">
                <div className="max-w-[1600px] mx-auto px-4 md:px-6">
                     <div className="bg-red-900/20 border border-red-500/30 p-4 text-center rounded-md flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <h3 className="text-red-400 font-bold uppercase text-sm">Continue Watching Offline</h3>
                        </div>
                        <p className="text-zinc-400 text-xs font-mono">{error}</p>
                     </div>
                </div>
            </section>
        );
    }

    if (watching.length === 0 && !isLoadingProgress) {
        return null;
    }

    return (
        <section className="mb-8 md:mb-12 relative group">
            <div className="max-w-[1600px] mx-auto px-3 md:px-6">
                <div className="flex items-end justify-between mb-3 md:mb-4 border-l-4 border-brand-400 pl-3 md:pl-4">
                     <div>
                        <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-wide font-display italic">
                            Continue Session
                        </h2>
                        <p className="text-brand-400 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-0.5">Resume Playback</p>
                    </div>
                </div>

                <div className="relative -mx-3 md:-mx-6 px-3 md:px-6">
                    <div className="flex overflow-x-auto gap-3 md:gap-5 pb-4 scrollbar-hide snap-x">
                        {isLoadingProgress ? (
                            [...Array(4)].map((_: any, i: number) => <ContinueWatchingCardSkeleton key={i} />)
                        ) : (
                            watching.map((item: UserProgress) => (
                                <ContinueWatchingCard key={item.animeId} progress={item} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export const Home: React.FC = () => {
  const { data: globalData, isLoading, isError, error } = useApi<HomeData>(constructUrl('home'));
  const { data: genresData } = useApi<string[]>(constructUrl('genres')); // Fetch genres dynamically
  
  const [customSlides, setCustomSlides] = useState<Anime[]>([]);

  // Fetch Custom Slides Logic
  useEffect(() => {
    const loadCustomSlides = async () => {
      const storedUrls = localStorage.getItem('custom_hero_urls');
      
      // Default URL config
      const defaultUrlConfig = { 
          url: 'https://res.cloudinary.com/dj5hhott5/raw/upload/v1767375104/heroslides_data.json',
          audioEnabled: true 
      };

      let configList: { url: string, audioEnabled: boolean }[] = [defaultUrlConfig];

      if (storedUrls) {
          try {
              const parsed = JSON.parse(storedUrls);
              // Handle legacy string array support
              if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
                  configList = parsed.map((url: string) => ({ url, audioEnabled: false }));
              } else if (Array.isArray(parsed)) {
                  configList = parsed;
              }
          } catch(e) {
              console.error("Failed to parse stored URLs, using default");
          }
      }

      // Helper to attempt finding the array of animes in various JSON structures
      const findAnimeArray = (obj: any): any[] => {
          if (!obj) return [];
          if (Array.isArray(obj)) return obj;

          // Check for single object that looks like an anime (Must have ID and Title/Name)
          if (obj && (obj.id || obj.animeId) && (obj.title || obj.name)) {
              return [obj];
          }

          // Common API structures
          if (obj.data) {
             if (Array.isArray(obj.data)) return obj.data;
             // Check deep nested spotlight
             if (obj.data.spotlight && Array.isArray(obj.data.spotlight)) return obj.data.spotlight;
             // Check if data itself is a single anime
             if ((obj.data.id || obj.data.animeId) && (obj.data.title || obj.data.name)) return [obj.data];
          }
          
          if (Array.isArray(obj.spotlight)) return obj.spotlight;
          if (Array.isArray(obj.results)) return obj.results;
          if (Array.isArray(obj.animes)) return obj.animes;
          
          // Fallback: search object values for first valid array
          if (typeof obj === 'object') {
              for (const key in obj) {
                  const val = obj[key];
                  if (Array.isArray(val) && val.length > 0) return val;
                  
                  // Check if value is a single anime object
                  if (val && typeof val === 'object' && (val.id || val.animeId) && (val.title || val.name)) {
                      return [val];
                  }
              }
          }
          return [];
      };

      const promises = configList.map(async (cfg: { url: string, audioEnabled: boolean }) => {
          if (!cfg.url) return [];
          try {
              const res = await fetch(cfg.url);
              if (!res.ok) {
                  console.warn(`Failed to fetch custom slide: ${cfg.url} (${res.status})`);
                  return [];
              }
              
              const responseData = await res.json();
              const rawSlides = findAnimeArray(responseData);

              if (rawSlides.length === 0) {
                  console.warn("No valid anime data found in custom slide JSON:", cfg.url);
                  return [];
              }
              
              // Robust mapping
              return rawSlides.map((data: any) => ({
                  id: data.id || data.animeId || `custom-${Math.random().toString(36).substr(2, 9)}`,
                  title: data.title || data.name || 'Untitled',
                  poster: data.poster || data.image || data.banner || '',
                  image: data.image || data.poster || '',
                  banner: data.banner || data.poster || '',
                  description: data.description || data.synopsis || '',
                  rank: data.rank || 0,
                  type: data.type || 'TV',
                  year: data.year || data.aired || '',
                  episodes: {
                      sub: data.episodes?.sub || 0,
                      dub: data.episodes?.dub || 0,
                      eps: data.episodes?.eps || 0
                  },
                  posterType: data.posterType || 'image',
                  allowAudio: cfg.audioEnabled // Pass user preference
              } as Anime));

          } catch (e) {
              console.error("Error loading custom slide:", cfg.url, e);
              return []; 
          }
      });
      
      const results = await Promise.all(promises);
      const validSlides = results.flat().filter(slide => slide.poster); // Filter out items without images
      setCustomSlides(validSlides);
    };

    loadCustomSlides();
  }, []);

  if (isLoading) {
      return (
          <div className="min-h-screen pt-24 pb-20 bg-dark-950">
              <div className="max-w-[1600px] mx-auto px-4 md:px-6 mb-8">
                  <div className="space-y-8 animate-pulse mt-8">
                      {/* Hero Skeleton */}
                      <div className="w-full h-[40vh] md:h-[60vh] bg-dark-800 rounded-sm mb-12 hidden md:block"></div>
                      
                      {/* Row Skeletons */}
                      {[1, 2, 3, 4].map((section) => (
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
              </div>
          </div>
      );
  }
  if (isError) return (
      <div className="h-screen flex flex-col items-center justify-center bg-dark-950 text-center px-4">
        <AlertTriangle className="w-16 h-16 text-brand-400 mb-4 opacity-50" />
        <h1 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">System Error</h1>
        <p className="text-zinc-500 font-mono text-sm">{error?.message || "Failed to load content"}</p>
      </div>
  );

  // Combine custom slides (fetched externally) with API spotlight slides
  const spotlight = [...customSlides, ...(globalData?.spotlight || globalData?.spotlightAnimes || globalData?.spotLightAnimes || [])];
  
  const trending = globalData?.trending || globalData?.trendingAnimes || [];
  const topAiring = globalData?.topAiring || globalData?.topAiringAnimes || globalData?.featuredAnimes?.topAiringAnimes || [];
  const topUpcoming = globalData?.topUpcoming || globalData?.topUpcomingAnimes || [];
  const latestEpisode = globalData?.latestEpisode || globalData?.latestEpisodeAnimes || globalData?.latestEpisodes || [];
  const top10 = globalData?.top10?.week || globalData?.top10Animes?.week || [];

  // New sections from featuredAnimes
  const mostPopular = globalData?.featuredAnimes?.mostPopularAnimes || [];
  const mostFavorite = globalData?.featuredAnimes?.mostFavoriteAnimes || [];
  const latestCompleted = globalData?.featuredAnimes?.latestCompletedAnimes || [];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="min-h-screen pb-20 bg-dark-950"
    >
      
      {/* Hero Section - Hidden on mobile */}
      <div className="hidden md:block">
        {spotlight.length > 0 && <Hero items={spotlight} />}
      </div>

      {/* Content pulled up slightly to overlap hero fade with z-index correction - Adjusted for less overlap */}
      <div className={`relative z-40 space-y-4 ${spotlight.length > 0 ? 'md:-mt-16 -mt-0 pt-20 md:pt-0' : 'pt-24'}`}>
        
        {/* Real Continue Watching Section */}
        <ContinueWatchingSection />

        {/* Latest Releases */}
        <HorizontalSection 
            title="Latest Updates" 
            subtitle="Fresh Releases"
            items={latestEpisode} 
            link="/animes/recently-updated"
        />

        {/* Catch Up Before New Season (Trending) */}
        <HorizontalSection 
            title="Trending Now" 
            items={trending} 
            link="/animes/trending"
        />

                {/* Most Popular */}
                <HorizontalSection 
                    title="Most Popular" 
                    subtitle="Fan Favorites"
                    items={mostPopular} 
                    link="/animes/most-popular"
                />

                {/* Top 10 Ranking */}
                <HorizontalSection 
                    title="Leaderboard" 
                    subtitle="Global Top 10"
                    items={top10} 
                />

                {/* Most Favorite */}
                <HorizontalSection 
                    title="Most Favorite" 
                    subtitle="Community Choice"
                    items={mostFavorite} 
                    link="/animes/most-favorite"
                />

                {/* Top Airing */}
                <HorizontalSection 
                    title="Top Airing" 
                    items={topAiring} 
                    link="/animes/top-airing"
                />

                {/* Latest Completed */}
                <HorizontalSection 
                    title="Just Finished" 
                    subtitle="Completed Series"
                    items={latestCompleted} 
                    link="/animes/completed"
                />

        {/* Upcoming */}
        <HorizontalSection 
            title="Coming Soon" 
            items={topUpcoming} 
            link="/animes/top-upcoming"
        />
        
        {/* Genre Grid Removed - Now on separate page /genres */}

      </div>
    </motion.div>
  );
};