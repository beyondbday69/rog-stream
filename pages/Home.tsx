import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, constructUrl } from '../services/api';
import { HomeData, Anime } from '../types';
import { Hero } from '../components/Hero';
import { ContinueWatchingCard } from '../components/ContinueWatchingCard';
import { ContinueWatchingCardSkeleton } from '../components/Skeletons';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProgress, UserProgress } from '../services/firebase';
import { motion } from 'framer-motion';

// ─── Seeded deterministic hash ───────────────────────────────────────────────
function seededRand(idx: number): number {
    let h = (idx + 1) * 2654435761;
    h = ((h >>> 16) ^ h) * 0x45d9f3b;
    h = ((h >>> 16) ^ h);
    return (h >>> 0) / 0xffffffff;
}

// ─── Tile sizes for 6-col grid ───────────────────────────────────────────────
interface TileSize { cols: number; rows: number }

const TILE_POOL: TileSize[] = [
    { cols: 1, rows: 2 },
    { cols: 1, rows: 2 },
    { cols: 1, rows: 2 },
    { cols: 1, rows: 2 },
    { cols: 1, rows: 3 },
    { cols: 2, rows: 2 },
    { cols: 2, rows: 3 },
    { cols: 1, rows: 2 },
    { cols: 2, rows: 2 },
    { cols: 1, rows: 3 },
    { cols: 3, rows: 2 },
    { cols: 1, rows: 2 },
];

const getTile = (idx: number): TileSize =>
    TILE_POOL[Math.floor(seededRand(idx) * TILE_POOL.length)];

// ─── Bento card ──────────────────────────────────────────────────────────────
const BentoCard: React.FC<{ anime: Anime; tile: TileSize; rank?: number }> = ({ anime, tile, rank }) => {
    const [loaded, setLoaded] = useState(false);
    const title  = anime.title || (anime as any).name || '';
    const isWide = tile.cols > 1;
    const isBig  = tile.cols >= 2 && tile.rows >= 2;
    const imgSrc = (isWide && anime.banner) ? anime.banner : (anime.poster || anime.image || (anime as any).img || anime.banner || '');

    return (
        <Link
            to={`/anime/${encodeURIComponent(anime.id)}`}
            className="relative overflow-hidden block group bg-dark-900"
            style={{ gridColumn: `span ${tile.cols}`, gridRow: `span ${tile.rows}` }}
        >
            {imgSrc && (
                <motion.img
                    src={imgSrc} alt={title} loading="lazy"
                    initial={{ opacity: 0 }} animate={{ opacity: loaded ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    onLoad={() => setLoaded(true)}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
            )}
            {!loaded && <div className="absolute inset-0 bg-dark-800 animate-pulse" />}

            <div className="absolute inset-0"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 55%)' }} />

            {rank && (
                <div className="absolute top-0 left-0 z-10 w-6 h-6 flex items-center justify-center font-black text-[10px]"
                    style={{ background: '#ff0033', color: '#000' }}>
                    {rank}
                </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-2 z-10">
                <h3
                    className={`font-black text-white leading-tight group-hover:text-red-400 transition-colors ${isBig ? 'text-xs md:text-sm' : 'text-[9px] md:text-[10px]'}`}
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
                >
                    {title}
                </h3>
            </div>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                style={{ background: 'rgba(0,0,0,0.15)' }}>
                <div className="w-8 h-8 flex items-center justify-center transition-transform scale-75 group-hover:scale-100"
                    style={{ background: 'rgba(255,0,51,0.9)', boxShadow: '0 0 18px rgba(255,0,51,0.6)' }}>
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white ml-0.5"><path d="M8 5v14l11-7z"/></svg>
                </div>
            </div>
        </Link>
    );
};

// ─── Grid section — no header ─────────────────────────────────────────────────
const GridSection: React.FC<{ items: Anime[]; showRank?: boolean; maxItems?: number }> = ({
    items, showRank = false, maxItems = 12
}) => {
    if (!items?.length) return null;
    const visible = items.slice(0, maxItems);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gridAutoRows: '88px', gap: '4px' }}>
            {visible.map((anime, idx) => (
                <BentoCard key={anime.id} anime={anime} tile={getTile(idx)} rank={showRank ? idx + 1 : undefined} />
            ))}
        </div>
    );
};

// ─── Continue Watching ────────────────────────────────────────────────────────
const ContinueWatchingSection: React.FC = () => {
    const [watching, setWatching]                   = useState<UserProgress[]>([]);
    const [isLoadingProgress, setIsLoadingProgress] = useState(true);
    const [error, setError]                         = useState<string | null>(null);
    const { user, loading: authLoading }            = useAuth();

    useEffect(() => {
        const run = async () => {
            setIsLoadingProgress(true); setError(null);
            if (authLoading) return;
            if (user) {
                try {
                    const data = await getUserProgress(user.uid);
                    setWatching(Object.values(data).filter(p => p.status === 'Watching').sort((a, b) => b.lastUpdated - a.lastUpdated));
                } catch (e: any) { setError(e.message); }
            } else { setWatching([]); }
            setIsLoadingProgress(false);
        };
        run();
    }, [user, authLoading]);

    if (authLoading || !user || (!isLoadingProgress && watching.length === 0 && !error)) return null;

    return (
        <div className="px-3 md:px-6 pb-1">
            {error ? (
                <div className="flex items-center gap-2 py-3 text-xs text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> {error}
                </div>
            ) : (
                <div className="flex overflow-x-auto gap-3 pb-3 scrollbar-hide -mx-3 md:-mx-6 px-3 md:px-6">
                    {isLoadingProgress
                        ? [...Array(4)].map((_: any, i: number) => <ContinueWatchingCardSkeleton key={i} />)
                        : watching.map(item => <ContinueWatchingCard key={item.animeId} progress={item} />)
                    }
                </div>
            )}
        </div>
    );
};

// ─── Home ─────────────────────────────────────────────────────────────────────
export const Home: React.FC = () => {
    const { data: globalData, isLoading, isError, error } = useApi<HomeData>(constructUrl('home'));
    const [customSlides, setCustomSlides] = useState<Anime[]>([]);

    useEffect(() => {
        const load = async () => {
            const storedUrls = localStorage.getItem('custom_hero_urls');
            const defaultCfg = {
                url: 'https://res.cloudinary.com/dj5hhott5/raw/upload/v1767375104/heroslides_data.json',
                audioEnabled: true,
            };
            let cfgList: { url: string; audioEnabled: boolean }[] = [defaultCfg];

            if (storedUrls) {
                try {
                    const p = JSON.parse(storedUrls);
                    cfgList = Array.isArray(p) && typeof p[0] === 'string'
                        ? p.map((u: string) => ({ url: u, audioEnabled: false }))
                        : Array.isArray(p) ? p : cfgList;
                } catch {}
            }

            const findArr = (obj: any): any[] => {
                if (!obj) return [];
                if (Array.isArray(obj)) return obj;
                if (obj.id && (obj.title || obj.name)) return [obj];
                if (obj.data) {
                    if (Array.isArray(obj.data)) return obj.data;
                    if (Array.isArray(obj.data?.spotlight)) return obj.data.spotlight;
                    if (obj.data.id) return [obj.data];
                }
                for (const k of ['spotlight','results','animes']) if (Array.isArray((obj as any)[k])) return (obj as any)[k];
                if (typeof obj === 'object') for (const k in obj) { const v = (obj as any)[k]; if (Array.isArray(v) && v.length) return v; }
                return [];
            };

            const results = await Promise.all(cfgList.map(async cfg => {
                try {
                    const res = await fetch(cfg.url);
                    if (!res.ok) return [];
                    return findArr(await res.json()).map((d: any) => ({
                        id: d.id || d.animeId || `c-${Math.random().toString(36).slice(2)}`,
                        title: d.title || d.name || 'Untitled',
                        poster: d.poster || d.image || d.banner || '',
                        image: d.image || d.poster || '',
                        banner: d.banner || d.poster || '',
                        description: d.description || '',
                        rank: d.rank || 0, type: d.type || 'TV',
                        episodes: { sub: d.episodes?.sub || 0, dub: d.episodes?.dub || 0, eps: d.episodes?.eps || 0 },
                        posterType: d.posterType || 'image',
                        allowAudio: cfg.audioEnabled,
                    } as Anime));
                } catch { return []; }
            }));
            setCustomSlides(results.flat().filter(s => s.poster));
        };
        load();
    }, []);

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (isLoading) return (
        <div className="min-h-screen bg-dark-950 pt-16">
            {/* Hero skeleton */}
            <div className="w-full h-[62vh] md:h-[82vh] bg-dark-800 animate-pulse" />
            {/* Grid skeleton */}
            <div className="max-w-[1600px] mx-auto px-3 md:px-6 py-4 space-y-1">
                {[1, 2].map(s => (
                    <div key={s} style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gridAutoRows: '88px', gap: '4px' }}>
                        {[...Array(12)].map((_, i) => {
                            const t = getTile(i);
                            return <div key={i} className="bg-dark-800 animate-pulse" style={{ gridColumn: `span ${t.cols}`, gridRow: `span ${t.rows}` }} />;
                        })}
                    </div>
                ))}
            </div>
        </div>
    );

    if (isError) return (
        <div className="h-screen flex flex-col items-center justify-center bg-dark-950 text-center px-4">
            <AlertTriangle className="w-12 h-12 text-red-500 mb-4 opacity-40" />
            <p className="text-zinc-500 font-mono text-sm">{error?.message || 'Failed to load'}</p>
        </div>
    );

    // ── Data ─────────────────────────────────────────────────────────────────
    const g = globalData as any;
    const spotlight       = [...customSlides, ...(g?.spotlight || g?.spotlightAnimes || g?.spotLightAnimes || [])];
    const latestEpisode   = g?.latestEpisode   || g?.latestEpisodeAnimes   || g?.latestEpisodes       || [];
    const trending        = g?.trending        || g?.trendingAnimes        || [];
    const mostPopular     = g?.featuredAnimes?.mostPopularAnimes           || [];
    const top10           = g?.top10?.week     || g?.top10Animes?.week     || [];
    const mostFavorite    = g?.featuredAnimes?.mostFavoriteAnimes          || [];
    const topAiring       = g?.topAiring       || g?.topAiringAnimes       || g?.featuredAnimes?.topAiringAnimes || [];
    const latestCompleted = g?.featuredAnimes?.latestCompletedAnimes       || [];
    const topUpcoming     = g?.topUpcoming     || g?.topUpcomingAnimes     || [];

    // Merge all into one big pool, deduplicated by id
    const seen = new Set<string>();
    const pool: Anime[] = [];
    for (const list of [latestEpisode, trending, mostPopular, top10, mostFavorite, topAiring, latestCompleted, topUpcoming]) {
        for (const anime of list) {
            if (!seen.has(anime.id)) { seen.add(anime.id); pool.push(anime); }
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            className="min-h-screen bg-dark-950"
        >
            <h1 className="sr-only">ROG Stream — Watch Anime Free</h1>

            {/* Hero */}
            {spotlight.length > 0 && <Hero items={spotlight} />}

            {/* Continue watching — horizontal scroll, no header */}
            <div className={`relative z-40 ${spotlight.length > 0 ? 'pt-6' : 'pt-24'}`}>
                <ContinueWatchingSection />

                {/* Single unified bento grid — no headers */}
                <div className="max-w-[1600px] mx-auto px-3 md:px-6 pb-20">
                    {/* Latest first */}
                    <GridSection items={latestEpisode} maxItems={12} />

                    {pool.length > 0 && <div className="h-px bg-white/[0.04] my-1" />}

                    {/* Trending + popular merged */}
                    <GridSection items={[...trending, ...mostPopular].filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i)} maxItems={18} />

                    <div className="h-px bg-white/[0.04] my-1" />

                    {/* Top 10 with rank badges */}
                    <GridSection items={top10} showRank maxItems={10} />

                    <div className="h-px bg-white/[0.04] my-1" />

                    {/* Airing + completed + upcoming */}
                    <GridSection items={[...topAiring, ...latestCompleted, ...topUpcoming, ...mostFavorite].filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i)} maxItems={18} />
                </div>
            </div>
        </motion.div>
    );
};
