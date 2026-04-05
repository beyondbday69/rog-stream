import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApi } from '../services/api';
import { LoaderCircle, AlertTriangle, ChevronLeft, List, Grid2X2, Search, Server, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

export const RegionalWatch: React.FC = () => {
    const { animeId, episodeNumber } = useParams<{ animeId: string, episodeNumber: string }>();
    const navigate = useNavigate();
    const [epSearch, setEpSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [isServersOpen, setIsServersOpen] = useState(false);
    const [isLangsOpen, setIsLangsOpen] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState<string>('');
    const [selectedServer, setSelectedServer] = useState<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const plyrRef = useRef<Plyr | null>(null);

    const { data: response, isLoading, isError, error } = useApi<any>(
        `https://hindiapi-green.vercel.app/api/v1/animelok/watch/${animeId}?ep=${episodeNumber}`
    );

    const watchData = response;

    const normalizeServerUrl = (rawUrl: any) => {
        if (typeof rawUrl !== 'string') return rawUrl;
        let url = rawUrl;

        try {
            if (url.includes('%')) {
                url = decodeURIComponent(url);
            }
            if (!url.startsWith('http') && !url.startsWith('//')) {
                try {
                    url = atob(url);
                } catch (e) {}
            }
        } catch (e) {
            console.error("Failed to decode server URL", e);
        }

        if (url.includes('localhost:4000')) {
            url = url.replace('http://localhost:4000', 'https://hindiapi-green.vercel.app');
        }

        return url;
    };

    // Auto-select first server when data loads
    useEffect(() => {
        if (watchData?.servers && watchData.servers.length > 0) {
            // Set initial language
            const langs = Array.from(new Set(watchData.servers.map((s: any) => s.language || 'Unknown')));
            const initialLang = (langs.includes('Hindi') ? 'Hindi' : langs[0]) as string;
            setSelectedLanguage(initialLang);
        }
    }, [watchData]);

    // Auto-select first server when language changes
    useEffect(() => {
        if (watchData?.servers && selectedLanguage) {
            const filteredServers = watchData.servers.filter((s: any) => (s.language || 'Unknown') === selectedLanguage);
            if (filteredServers.length > 0) {
                // If current selected server is not in the new language, select first
                if (!selectedServer || (selectedServer.language || 'Unknown') !== selectedLanguage) {
                    const server = filteredServers[0];
                    const url = normalizeServerUrl(server.url);
                    setSelectedServer({ ...server, url });
                }
            }
        }
    }, [selectedLanguage, watchData]);

    // HLS Player Setup
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !selectedServer || !selectedServer.isM3U8 || !selectedServer.url) return;

        let hls: Hls | null = null;

        // Initialize Plyr if not already initialized
        if (!plyrRef.current) {
            plyrRef.current = new Plyr(video, {
                controls: [
                    'play-large', 'play', 'progress', 'current-time', 'duration', 
                    'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
                ],
                settings: ['captions', 'quality', 'speed', 'loop'],
            });
        }

        if (Hls.isSupported()) {
            const PROXY_BASE = 'https://hindiapi-green.vercel.app/api/v1/animelok/proxy?url=';

            function rewriteM3u8(m3u8Text: string, baseUrl: string) {
                const lines = m3u8Text.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    let line = lines[i].trim();
                    if (!line) continue;
                    
                    if (line.startsWith('#EXT-X-')) {
                        // Rewrite URI="..."
                        const uriMatch = line.match(/URI="([^"]+)"/);
                        if (uriMatch) {
                            const uri = uriMatch[1];
                            if (!uri.startsWith('data:')) {
                                try {
                                    const absoluteUrl = new URL(uri, baseUrl).href;
                                    const proxiedUrl = PROXY_BASE + encodeURIComponent(absoluteUrl);
                                    lines[i] = line.replace(`URI="${uri}"`, `URI="${proxiedUrl}"`);
                                } catch (e) {
                                    console.error("Failed to parse URI", uri, e);
                                }
                            }
                        }
                    } else if (!line.startsWith('#')) {
                        // It's a URL line
                        try {
                            const absoluteUrl = new URL(line, baseUrl).href;
                            lines[i] = PROXY_BASE + encodeURIComponent(absoluteUrl);
                        } catch (e) {
                            console.error("Failed to parse URL", line, e);
                        }
                    }
                }
                return lines.join('\n');
            }

            class ProxyLoader extends Hls.DefaultConfig.loader {
                constructor(config: any) {
                    super(config);
                    const originalLoad = this.load.bind(this);
                    
                    this.load = function (context: any, config: any, callbacks: any) {
                        let originalUrl = context.url;
                        
                        if (typeof originalUrl === 'string' && originalUrl.startsWith(PROXY_BASE)) {
                            // Extract the actual URL so we can resolve relative paths inside the m3u8
                            const encodedUrl = originalUrl.substring(PROXY_BASE.length);
                            originalUrl = decodeURIComponent(encodedUrl);
                        } else if (typeof originalUrl === 'string') {
                            // Wrap the URL in the proxy
                            context.url = PROXY_BASE + encodeURIComponent(originalUrl);
                        }
                        
                        const onSuccess = callbacks.onSuccess;
                        callbacks.onSuccess = function (response: any, stats: any, context: any, networkDetails: any) {
                            // Check if the response is an m3u8 playlist
                            if (typeof response.data === 'string' && response.data.includes('#EXTM3U')) {
                                response.data = rewriteM3u8(response.data, originalUrl);
                            }
                            onSuccess(response, stats, context, networkDetails);
                        };
                        
                        originalLoad(context, config, callbacks);
                    };
                }
            }

            hls = new Hls({
                pLoader: ProxyLoader as any,
                fLoader: ProxyLoader as any,
            });
            
            // Wrap the initial URL in the proxy
            const initialUrl = (typeof selectedServer.url === 'string' && selectedServer.url.startsWith(PROXY_BASE))
                ? selectedServer.url 
                : PROXY_BASE + encodeURIComponent(selectedServer.url || '');
                
            hls.loadSource(initialUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                video.play().catch(e => console.log("Auto-play prevented", e));
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = selectedServer.url;
            video.addEventListener('loadedmetadata', () => {
                video.play().catch(e => console.log("Auto-play prevented", e));
            });
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [selectedServer]);

    // Cleanup Plyr on unmount
    useEffect(() => {
        return () => {
            if (plyrRef.current) {
                plyrRef.current.destroy();
                plyrRef.current = null;
            }
        };
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center text-brand-400 gap-4">
                <LoaderCircle className="w-16 h-16 animate-spin" />
                <span className="font-bold text-sm tracking-widest uppercase">Loading Stream...</span>
            </div>
        );
    }

    if (isError || !watchData) {
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

    const episodes = watchData.episodes || [];
    const filteredEpisodes = episodes.filter((ep: any) => 
        ep.number.toString().includes(epSearch) || 
        (ep.title && ep.title.toLowerCase().includes(epSearch.toLowerCase()))
    );

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
                            {watchData.title || `Episode ${episodeNumber}`}
                        </h1>
                        <p className="text-zinc-500 text-[10px] md:text-xs font-mono">
                            {watchData.animeTitle}
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
                            {selectedServer ? (
                                selectedServer.isM3U8 ? (
                                    <video 
                                        ref={videoRef}
                                        crossOrigin="anonymous"
                                        playsInline
                                        className="w-full h-full"
                                        poster={episodes.find((e: any) => e.number.toString() === episodeNumber)?.image}
                                    />
                                ) : (
                                    <iframe 
                                        src={selectedServer.url} 
                                        className="w-full h-full border-none"
                                        allowFullScreen
                                    />
                                )
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono text-sm">
                                    Select a server to start watching
                                </div>
                            )}
                        </div>

                        {/* Languages & Servers List */}
                        {watchData.servers && watchData.servers.length > 0 && (
                            <div className="space-y-4">
                                {/* Languages Drawer */}
                                <div className="bg-dark-900 border border-dark-700 rounded-sm overflow-hidden">
                                    <button 
                                        onClick={() => setIsLangsOpen(!isLangsOpen)}
                                        className="w-full flex items-center justify-between p-2 md:p-3 bg-dark-800 hover:bg-dark-700 transition-colors"
                                    >
                                        <h3 className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <List className="w-3 h-3 md:w-4 md:h-4 text-brand-400" /> Languages
                                        </h3>
                                        <motion.div animate={{ rotate: isLangsOpen ? 180 : 0 }}>
                                            <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-zinc-500" />
                                        </motion.div>
                                    </button>
                                    <motion.div 
                                        initial={false}
                                        animate={{ height: isLangsOpen ? 'auto' : 0, opacity: isLangsOpen ? 1 : 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-2 md:p-3 flex flex-wrap gap-2">
                                            {Array.from(new Set(watchData.servers.map((s: any) => s.language || 'Unknown'))).map((lang: any) => (
                                                <button
                                                    key={lang}
                                                    onClick={() => setSelectedLanguage(lang)}
                                                    className={`px-3 py-1.5 rounded-sm text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                                        selectedLanguage === lang
                                                        ? 'bg-brand-400 text-black border-brand-400'
                                                        : 'bg-dark-800 border-dark-600 text-zinc-400 hover:border-brand-400/50'
                                                    }`}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Servers Drawer */}
                                <div className="bg-dark-900 border border-dark-700 rounded-sm overflow-hidden">
                                    <button 
                                        onClick={() => setIsServersOpen(!isServersOpen)}
                                        className="w-full flex items-center justify-between p-2 md:p-3 bg-dark-800 hover:bg-dark-700 transition-colors"
                                    >
                                        <h3 className="text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Server className="w-3 h-3 md:w-4 md:h-4 text-brand-400" /> Servers ({selectedLanguage})
                                        </h3>
                                        <motion.div animate={{ rotate: isServersOpen ? 180 : 0 }}>
                                            <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-zinc-500" />
                                        </motion.div>
                                    </button>
                                    <motion.div 
                                        initial={false}
                                        animate={{ height: isServersOpen ? 'auto' : 0, opacity: isServersOpen ? 1 : 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-2 md:p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {watchData.servers
                                                .filter((s: any) => (s.language || 'Unknown') === selectedLanguage)
                                                .map((server: any, idx: number) => {
                                                    const serverUrl = normalizeServerUrl(server.url);
                                                        
                                                    const isSelected = selectedServer?.url === serverUrl;
                                                    
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setSelectedServer({ ...server, url: serverUrl })}
                                                            className={`flex flex-col items-start px-2 py-1.5 text-left rounded-sm transition-all border ${
                                                                isSelected 
                                                                ? 'bg-brand-400/10 border-brand-400' 
                                                                : 'bg-dark-800 border-dark-600 hover:border-brand-400/50 hover:bg-dark-700'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-1 mb-0.5 w-full">
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${isSelected ? 'text-brand-400' : 'text-zinc-300'}`}>
                                                                    {server.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1 w-full">
                                                                {server.tip && (
                                                                    <span className={`text-[9px] font-mono truncate ${isSelected ? 'text-brand-400/80' : 'text-zinc-500'}`}>
                                                                        {server.tip}
                                                                    </span>
                                                                )}
                                                                {server.isM3U8 && (
                                                                    <span className="ml-auto text-[8px] font-bold text-zinc-500 border border-zinc-700 px-0.5 rounded-sm">HLS</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        )}
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
                                        <div className="space-y-1">
                                            {filteredEpisodes.map((ep: any) => {
                                                const isActive = ep.number.toString() === episodeNumber;
                                                return (
                                                    <Link 
                                                        key={ep.number}
                                                        to={`/regional/watch/${animeId}/${ep.number}`}
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
                                                const isActive = ep.number.toString() === episodeNumber;
                                                return (
                                                    <Link 
                                                        key={ep.number}
                                                        to={`/regional/watch/${animeId}/${ep.number}`}
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
                </div>
            </div>
        </motion.div>
    );
};
