import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi, constructUrl } from '../services/api';
import { AnimeDetail as AnimeDetailType } from '../types';
import { Play, Layers, AlertTriangle, ChevronDown, ChevronUp, Tv, Globe, Share2, BookmarkPlus, Check, CheckCircle, LoaderCircle, Star, Users, MessageSquareQuote } from 'lucide-react';
import { DetailSkeleton } from '../components/Skeletons';
import { AnimeCard } from '../components/AnimeCard';
import { useAuth } from '../context/AuthContext';
import { getUserProgress, UserProgress, addToWatchlist, removeUserProgress } from '../services/firebase';
import { motion } from 'framer-motion';

// Helper component for Section Headers to match the design
const SectionHeader: React.FC<{ title: string; subtitle?: string; meta?: string; children?: React.ReactNode }> = ({ title, subtitle, meta, children }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 md:mb-6 gap-3 md:gap-4">
        <div className="flex items-center gap-3 md:gap-4">
            <div className="w-1 h-6 md:h-8 bg-brand-400" />
            <div>
                <h2 className="text-xl md:text-3xl font-black text-white uppercase font-display tracking-wide">
                    {title}
                </h2>
                {subtitle && <p className="text-sm md:text-lg text-zinc-400 font-sans -mt-1 md:-mt-2">{subtitle}</p>}
            </div>
        </div>
        <div className="flex items-center gap-4">
          {meta && <span className="text-brand-400 font-mono text-[10px] md:text-xs font-bold px-3 py-1 border border-brand-400 hidden md:block">{meta}</span>}
          {children}
        </div>
    </div>
);

const ReviewCard: React.FC<{ review: any }> = ({ review }) => {
    const [expanded, setExpanded] = useState(false);
    
    return (
        <div className="bg-dark-800 border border-white/5 p-4 rounded-sm flex-shrink-0 w-[85vw] sm:w-[350px] md:w-[400px] snap-start h-fit flex flex-col group hover:border-brand-400/30 transition-colors">
             <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full overflow-hidden bg-dark-700 border border-white/10">
                        <img 
                            src={review.user?.images?.jpg?.image_url} 
                            alt={review.user?.username} 
                            className="w-full h-full object-cover" 
                            onError={(e) => (e.currentTarget.src = "https://ui-avatars.com/api/?name=" + (review.user?.username || 'User') + "&background=random")}
                        />
                     </div>
                     <div className="flex flex-col">
                         <span className="text-sm font-bold text-white leading-none mb-1">{review.user?.username}</span>
                         <span className="text-[10px] text-zinc-500 font-mono">{new Date(review.date).toLocaleDateString()}</span>
                     </div>
                 </div>
                 {review.score && (
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-brand-400 text-black text-xs font-black rounded-sm transform -skew-x-12 shadow-[0_0_10px_rgba(255,0,51,0.3)]">
                        <span className="skew-x-12">{review.score}</span>
                    </div>
                 )}
             </div>
             
             <div className="text-xs md:text-sm text-zinc-400 leading-relaxed font-sans mb-4 flex-1">
                 <p className={`${!expanded ? 'line-clamp-4' : ''} whitespace-pre-wrap`}>
                     {review.review}
                 </p>
                 {review.review.length > 200 && (
                     <button 
                        onClick={() => setExpanded(!expanded)}
                        className="text-[10px] text-brand-400 uppercase font-bold mt-2 hover:text-white transition-colors flex items-center gap-1"
                     >
                         {expanded ? <>Show Less <ChevronUp className="w-3 h-3" /></> : <>Read More <ChevronDown className="w-3 h-3" /></>}
                     </button>
                 )}
             </div>
             
             <div className="mt-auto pt-3 border-t border-white/5 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                 {review.tags?.map((tag: string) => (
                     <span key={tag} className="text-zinc-500 bg-dark-950 px-2 py-1 rounded-sm border border-white/5">{tag}</span>
                 ))}
                 {review.is_spoiler && (
                     <span className="ml-auto text-red-500 bg-red-500/10 px-2 py-1 rounded-sm border border-red-500/20 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Spoiler
                     </span>
                 )}
             </div>
        </div>
    );
};


export const AnimeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [showFullDesc, setShowFullDesc] = useState(false);
  const { user } = useAuth();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  
  // Interaction states
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Extra MAL Data State
  const [malData, setMalData] = useState<{ score: number | null; scored_by: number | null } | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  
  // Page Ready State (Blocks rendering until Rating is fetched)
  const [isRatingLoading, setIsRatingLoading] = useState(true);

  const { data: rawAnime, isLoading: isAnimeLoading, isError: isAnimeError } = useApi<any>(
      constructUrl('details', { id })
  );

  const { data: rawEpisodes, isLoading: isEpisodesLoading, isError: isEpisodesError } = useApi<any>(
      constructUrl('episodes', { id })
  );

  const isLoading = isAnimeLoading || isEpisodesLoading;
  const isError = isAnimeError || isEpisodesError;

  const anime = useMemo(() => rawAnime ? {
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
      episodes: (rawEpisodes?.episodes || rawAnime.episodes || []).map((ep: any) => ({
          ...ep,
          id: ep.episodeId || ep.id,
          number: ep.episodeNo || ep.number,
          title: ep.name || ep.title,
          isFiller: ep.filler || ep.isFiller
      }))
  } : null, [rawAnime, rawEpisodes]);

  useEffect(() => {
    const fetchProgress = async () => {
        if (user && id) {
            try {
                const allProgress = await getUserProgress(user.uid);
                if (allProgress[id]) {
                    setUserProgress(allProgress[id]);
                } else {
                    setUserProgress(null);
                }
            } catch (e) {
                console.error("Failed to fetch user progress:", e);
                setUserProgress(null);
            }
        } else {
          setUserProgress(null);
        }
    };
    fetchProgress();
  }, [id, user]);

  useEffect(() => {
    if (isLoading) return;

    if (!anime) {
        setIsRatingLoading(false);
        return;
    }
    
    let isMounted = true;

    const loadMalInfo = async () => {
        setIsRatingLoading(true);
        let effectiveMalId = anime.malID;

        // If no MAL ID provided by backend, try to find it via Jikan Search
        if (!effectiveMalId) {
            try {
                // Search Jikan
                const searchRes = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(anime.title)}&limit=1`);
                if (searchRes.ok) {
                    const searchData = await searchRes.json();
                    if (isMounted && searchData.data && searchData.data.length > 0) {
                        effectiveMalId = searchData.data[0].mal_id;
                    }
                }
            } catch(e) {
                console.warn("MAL ID Search failed", e);
            }
        }

        if (isMounted && effectiveMalId) {
            // Fetch stats and reviews
            try {
                const statsRes = await fetch(`https://api.jikan.moe/v4/anime/${effectiveMalId}`);
                if (statsRes.ok) {
                    const statsData = await statsRes.json();
                    if (isMounted && statsData.data) {
                        setMalData({
                            score: statsData.data.score,
                            scored_by: statsData.data.scored_by
                        });
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch MAL stats", e);
            }

            try {
                const reviewsRes = await fetch(`https://api.jikan.moe/v4/anime/${effectiveMalId}/reviews?sort=most_voted&limit=10`);
                if (reviewsRes.ok) {
                    const reviewsData = await reviewsRes.json();
                    if (isMounted) {
                        setReviews(reviewsData.data || []);
                    }
                }
            } catch (e) {
                console.warn("Failed to fetch reviews", e);
            }
        } else if (isMounted) {
            setMalData(null);
            setReviews([]);
        }
        
        if (isMounted) {
            setIsRatingLoading(false);
        }
    };

    loadMalInfo();
    
    return () => {
        isMounted = false;
    };
  }, [anime?.id, isLoading]);
  
  // Reset state on ID change
  useEffect(() => {
    setIsRatingLoading(true);
    setMalData(null);
    setReviews([]);
    setShowFullDesc(false);
    setCopied(false);
    setIsSaving(false);
  }, [id]);
  
  const handleShare = async () => {
    try {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (e) {
        console.error("Copy failed", e);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!user) {
        alert("Please login to manage your watchlist");
        return;
    }
    if (!anime) return;

    setIsSaving(true);
    try {
        if (userProgress) {
            await removeUserProgress(user.uid, anime.id);
            setUserProgress(null);
        } else {
            await addToWatchlist(user.uid, anime);
            // Optimistically update local state
            setUserProgress({
                 animeId: anime.id,
                 title: anime.title,
                 poster: anime.poster || anime.image,
                 currentEpisode: 0,
                 totalEpisodes: anime.totalEpisodes || anime.episodes?.length || 0,
                 status: 'On Hold',
                 lastUpdated: Date.now()
            });
        }
    } catch (e) {
        console.error("Failed to update watchlist", e);
    } finally {
        setIsSaving(false);
    }
  };
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // Block rendering until both main data AND rating are ready
  if (isLoading || isRatingLoading) return <DetailSkeleton />;

  if (isError || !anime) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-dark-900 text-white gap-4">
           <AlertTriangle className="w-16 h-16 text-brand-400" />
           <p className="text-zinc-500 font-mono">DATA NOT FOUND</p>
           <Link to="/" className="text-sm font-bold text-brand-400 hover:underline uppercase tracking-wider">Return to Base</Link>
        </div>
     );
  }

  const heroImage = anime.banner || anime.image;
  const episodes = anime.episodes || [];
  const lastWatchedEpNumber = userProgress?.currentEpisode;

  // Determine the next episode to watch for the "Continue" button and highlighting
  const nextEpisodeToWatch = lastWatchedEpNumber 
    ? episodes.find((e: any) => e.number === lastWatchedEpNumber + 1) || episodes.find((e: any) => e.number === lastWatchedEpNumber)
    : episodes[0];
  
  const watchLink = nextEpisodeToWatch
    ? `/watch/${id}/${nextEpisodeToWatch.number}` 
    : (episodes.length > 0 ? `/watch/${id}/${episodes[0].number}` : '#');
  
  const displayScore = malData?.score || anime.malScore;
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-dark-900 text-white pb-20"
    >
      
      {/* Header Section */}
      <div className="relative w-full h-[40vh] min-h-[300px] md:h-[60vh] md:min-h-[500px] bg-dark-950 overflow-hidden">
        <div className="absolute inset-0">
             <img 
                src={heroImage} 
                className="w-full h-full object-cover opacity-20 blur-sm" 
                alt="Banner" 
             />
             <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/70 to-transparent" />
             <div className="absolute inset-0 bg-gradient-to-r from-dark-900/80 to-transparent" />
        </div>

        <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-row items-center pb-8 md:pb-12 gap-4 md:gap-8">
            {/* Left: Poster */}
            <div className="w-28 sm:w-40 md:w-64 flex-shrink-0 -mb-10 md:-mb-28 shadow-2xl z-20">
                <img src={anime.image} alt={anime.title} className="w-full aspect-[2/3] object-cover rounded-sm border border-white/10" />
            </div>

            {/* Right: Details Block */}
            <div className="flex flex-col text-left z-10 w-full">
                {/* Tags */}
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-4">
                    {anime.status && <span className={`px-2 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-widest ${anime.status === 'Completed' ? 'bg-green-500 text-black' : 'bg-brand-400 text-black'}`}>{anime.status}</span>}
                    {anime.type && <span className="px-2 py-1 bg-dark-800 border border-dark-600 text-zinc-300 text-[9px] md:text-[10px] font-bold uppercase">{anime.type}</span>}
                    {anime.season && <span className="px-2 py-1 bg-dark-800 border border-dark-600 text-zinc-300 text-[9px] md:text-[10px] font-bold uppercase">{anime.season}</span>}
                </div>

                {/* Title */}
                <h1 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase font-display tracking-tighter drop-shadow-xl line-clamp-3">
                    {anime.title}
                </h1>
                {anime.japaneseTitle && (
                    <h2 className="text-zinc-400 font-display text-xs md:text-xl uppercase tracking-wider mt-0.5 md:mt-1 truncate">RE: {anime.japaneseTitle}</h2>
                )}
                
                {/* Stats & Buttons Container */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-zinc-300 mt-2 md:mt-4 border-t border-white/10 pt-2 md:pt-4">
                    {displayScore && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-sm">
                                <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-yellow-500 font-bold">{displayScore}</span>
                            </div>
                            {malData?.scored_by && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded-sm" title={`${malData.scored_by.toLocaleString()} users rated`}>
                                    <Users className="w-3 h-3 md:w-4 md:h-4 text-zinc-400" />
                                    <span className="text-zinc-400 font-bold text-[9px] md:text-[10px]">
                                        {formatNumber(malData.scored_by)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    {anime.type && <div className="flex items-center gap-1.5"><Tv className="w-3 h-3 md:w-4 md:h-4 text-brand-400" /><span>{anime.type}</span></div>}
                    {anime.totalEpisodes && <div className="flex items-center gap-1.5"><Layers className="w-3 h-3 md:w-4 md:h-4 text-brand-400" /><span>{anime.totalEpisodes} EPS</span></div>}
                    <div className="flex items-center gap-1.5"><Globe className="w-3 h-3 md:w-4 md:h-4 text-brand-400" /><span>{anime.hasSub && 'SUB'}{anime.hasSub && anime.hasDub && ' | '}{anime.hasDub && 'DUB'}</span></div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 ml-auto">
                        <button 
                            onClick={handleShare}
                            className="p-2 bg-dark-800 hover:bg-white hover:text-black text-zinc-400 rounded-full transition-colors relative border border-white/5" 
                            title="Share"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={handleWatchlistToggle}
                            disabled={isSaving}
                            className={`p-2 rounded-full transition-all border border-white/5 ${
                                userProgress 
                                    ? 'bg-brand-400 text-black border-brand-400 shadow-[0_0_10px_rgba(255,0,51,0.5)]' 
                                    : 'bg-dark-800 hover:bg-brand-400 hover:text-black text-zinc-400'
                            }`} 
                            title={userProgress ? "Remove from Library" : "Add to Library"}
                        >
                            {isSaving ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            ) : userProgress ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <BookmarkPlus className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 md:mt-20 grid grid-cols-1 gap-8 md:gap-12">
        <div className="space-y-8 md:space-y-12">
            <section>
                <SectionHeader title="Description" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative text-zinc-300 leading-relaxed font-sans text-sm md:text-base">
                            <p className={`${!showFullDesc && 'line-clamp-4'}`}>
                                {anime.description}
                            </p>
                            {anime.description?.length > 300 && (
                                <button 
                                    onClick={() => setShowFullDesc(!showFullDesc)}
                                    className="text-brand-400 font-bold text-xs mt-4 flex items-center gap-1 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    {showFullDesc ? <>Collapse Data <ChevronUp className="w-3 h-3"/></> : <>Expand Data <ChevronDown className="w-3 h-3"/></>}
                                </button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {anime.genres?.map((g: string) => (
                                <Link key={g} to={`/animes/${g.toLowerCase()}`} className="px-2 py-1 md:px-3 border border-dark-700 bg-dark-800 text-[10px] md:text-xs font-bold uppercase tracking-wider hover:bg-brand-400 hover:text-black hover:border-brand-400 transition-all text-zinc-400">
                                    {g}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* More Info Sidebar */}
                    <div className="bg-dark-800/50 border border-white/5 p-6 rounded-sm space-y-4">
                        <h3 className="text-white font-black uppercase text-sm tracking-widest border-b border-white/10 pb-2">More Info</h3>
                        <div className="space-y-3">
                            {anime.moreInfo && Object.entries(anime.moreInfo).map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{key}</span>
                                    <span className="text-xs text-zinc-300 font-medium">{value as string}</span>
                                </div>
                            ))}
                            {/* Fallback if moreInfo is empty but we have some fields */}
                            {!anime.moreInfo && (
                                <>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Status</span>
                                        <span className="text-xs text-zinc-300 font-medium">{anime.status || 'Unknown'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Type</span>
                                        <span className="text-xs text-zinc-300 font-medium">{anime.type || 'Unknown'}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Season</span>
                                        <span className="text-xs text-zinc-300 font-medium">{anime.season || 'Unknown'}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <SectionHeader title="Episode" meta={`${episodes.length} FILES`}>
                    {episodes.length > 0 && user && nextEpisodeToWatch && (
                        <Link to={watchLink} className="flex items-center gap-2 px-4 py-2 md:px-6 bg-brand-400 hover:bg-white text-black font-black uppercase text-xs tracking-widest transition-all skew-x-[-12deg] shadow-[0_0_15px_rgba(255,0,51,0.3)]">
                            <Play className="w-3 h-3 md:w-4 md:h-4 fill-black skew-x-[12deg]"/>
                            <span className="skew-x-[12deg]">
                                {lastWatchedEpNumber ? `Ep. ${nextEpisodeToWatch.number}` : 'Watch'}
                            </span>
                        </Link>
                    )}
                </SectionHeader>

                {episodes.length > 0 ? (
                    <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-dark-800/50 bg-dark-900 border border-dark-700">
                        <div className="flex flex-col divide-y divide-dark-700">
                            {episodes.map((ep: any) => {
                                const isWatched = lastWatchedEpNumber ? ep.number <= lastWatchedEpNumber : false;
                                const isNextUp = nextEpisodeToWatch ? ep.id === nextEpisodeToWatch.id : false;

                                return (
                                    <Link 
                                        key={ep.id}
                                        to={`/watch/${id}/${ep.number}`}
                                        className={`group flex items-center gap-3 md:gap-4 p-3 md:p-4 transition-all duration-200 ${
                                            isNextUp 
                                                ? 'bg-brand-400/10 border-l-4 border-brand-400' 
                                                : 'border-l-4 border-transparent hover:bg-dark-800'
                                        } ${isWatched && !isNextUp ? 'opacity-60 hover:opacity-100' : ''}`}
                                    >
                                        <span className={`text-lg md:text-xl font-black font-mono transition-colors w-6 md:w-8 text-center ${
                                            isNextUp ? 'text-brand-400' : 'text-zinc-600 group-hover:text-zinc-400'
                                        }`}>
                                            {ep.number}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-xs md:text-sm line-clamp-1 transition-colors ${
                                                isNextUp ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                                            }`}>
                                                {ep.title || `Episode ${ep.number}`}
                                            </p>
                                        </div>
                                        {ep.isFiller && (
                                            <span className="text-[9px] bg-red-900/50 text-red-400 px-2 py-0.5 font-bold uppercase rounded-sm flex-shrink-0">
                                                Filler
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="p-12 bg-dark-800/50 text-center border border-dark-600">
                        <p className="text-zinc-500 font-mono text-sm">NO EPISODE DATA AVAILABLE</p>
                    </div>
                )}
            </section>
            
            {/* Reviews Section */}
            {reviews.length > 0 && (
                <section>
                    <SectionHeader title="Community" subtitle="Reviews" meta={`${reviews.length} POSTS`} />
                    <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                        {reviews.map((review, idx) => (
                            <ReviewCard key={review.mal_id || idx} review={review} />
                        ))}
                    </div>
                </section>
            )}
            
            {(anime.relatedAnime?.length > 0 || anime.recommendations?.length > 0) && (
                <section>
                     <SectionHeader title="Related" subtitle="Database" />
                    <div className="flex overflow-x-auto gap-2 md:gap-4 pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                        {[...(anime.relatedAnime || []), ...(anime.recommendations || [])].slice(0, 10).map(rel => (
                            <AnimeCard key={rel.id} anime={rel} />
                        ))}
                    </div>
                </section>
            )}
        </div>
      </div>
    </motion.div>
  );
}