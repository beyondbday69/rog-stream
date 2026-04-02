import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, AudioWaveform } from 'lucide-react';
import { Anime } from '../types';

interface HeroProps {
  items: Anime[];
}

export const Hero: React.FC<HeroProps> = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayItems, setDisplayItems] = useState<Anime[]>([]);
  const currentIndexRef = useRef(currentIndex);
  const transitionTriggeredRef = useRef(false);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);
  
  // UI Config State with defaults
  const [config, setConfig] = useState({
      interval: 8000,
      showTitle: true,
      titleColor: '#ffffff',
      titleSize: 'large',
      aspectRatio: '16:9' // Default to 16:9
  });

  useEffect(() => {
    // Load config from localStorage
    try {
        const stored = localStorage.getItem('ui_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            setConfig({
                interval: Number(parsed.slideInterval) || 8000,
                showTitle: parsed.showHeroTitle !== undefined ? parsed.showHeroTitle : true,
                titleColor: parsed.heroTitleColor || '#ffffff',
                titleSize: parsed.heroTitleFontSize || 'large',
                aspectRatio: parsed.heroAspectRatio || '16:9'
            });
        }
    } catch (e) {
        console.error("Failed to load UI config");
    }
  }, []);

  // Preloading and display logic
  useEffect(() => {
    if (!items || items.length === 0) {
        setDisplayItems([]);
        return;
    }

    const imageSlides = items.filter(item => item.posterType !== 'video');
    const videoSlides = items.filter(item => item.posterType === 'video');

    // Initially display only images, or all if no images exist.
    setDisplayItems(imageSlides.length > 0 ? imageSlides : items);
    setCurrentIndex(0); // Reset index when items change

    const videosToLoad = [...videoSlides];
    
    const loadNextVideo = () => {
        if (videosToLoad.length === 0) return;
        const videoSlide = videosToLoad.shift();
        
        if (videoSlide && videoSlide.poster) {
            const videoEl = document.createElement('video');
            videoEl.src = videoSlide.poster; // Full quality URL
            
            videoEl.oncanplaythrough = () => {
                setDisplayItems((currentDisplayItems: Anime[]) => {
                    // Avoid adding duplicates
                    if (currentDisplayItems.some((item: Anime) => item.id === videoSlide.id)) {
                        return currentDisplayItems;
                    }
                    const newItems = [...currentDisplayItems];
                    // Insert after the currently visible slide
                    const insertAt = Math.min(currentIndexRef.current + 1, newItems.length);
                    newItems.splice(insertAt, 0, videoSlide);
                    return newItems;
                });
                loadNextVideo(); // Load next video in sequence
            };

            videoEl.onerror = () => {
                console.error('Failed to preload video:', videoSlide.poster);
                loadNextVideo(); // Try next one anyway
            };
        } else {
            loadNextVideo(); // Skip if no video slide or poster
        }
    };

    if (videoSlides.length > 0) {
        loadNextVideo();
    }
  // We only want this effect to run when the input `items` change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleNext = useCallback(() => {
    if (displayItems.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % displayItems.length);
  }, [displayItems.length]);

  // Combined effect for image slide intervals and resetting the video trigger ref.
  useEffect(() => {
    // Reset trigger on every slide change
    transitionTriggeredRef.current = false;

    if (displayItems.length <= 1) return;

    const currentItem = displayItems[currentIndex];
    const isVideo = currentItem?.posterType === 'video';

    // If it's a video, the timer is handled by onTimeUpdate prop.
    // This effect only needs to handle the interval for images.
    if (isVideo) {
      return;
    }

    // Fallback to interval for images
    const interval = setInterval(handleNext, config.interval);

    return () => clearInterval(interval);
  }, [displayItems, currentIndex, config.interval, handleNext]);


  // Helper to get Tailwind classes based on size setting (Updated for mobile density)
  const getTitleSizeClasses = (size: string) => {
      switch(size) {
          case 'small': return 'text-xl md:text-3xl lg:text-4xl';
          case 'normal': return 'text-2xl md:text-4xl lg:text-5xl';
          case 'large': return 'text-2xl md:text-5xl lg:text-6xl'; // Smaller on mobile
          case 'massive': return 'text-3xl md:text-7xl lg:text-8xl'; // Smaller on mobile
          default: return 'text-2xl md:text-5xl lg:text-6xl';
      }
  };

  // Helper for Aspect Ratio
  const getAspectRatioClass = () => {
    switch(config.aspectRatio) {
        case '16:9': return 'aspect-video';
        case 'cinematic': return 'h-[50vh] md:h-[80vh]';
        case 'fullscreen': return 'h-screen';
        default: return 'aspect-video';
    }
  };

  if (!displayItems || displayItems.length === 0) return null;
  const current = displayItems[currentIndex];

  // Fallback if banner is missing, prioritize banner for 16:9
  const heroImage = current.banner || current.image || current.poster || current.img;
  const isVideo = current.posterType === 'video';

  return (
    <div className={`relative w-full ${getAspectRatioClass()} overflow-hidden bg-[#050505] group font-sans transition-all duration-500`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
        >
           {/* Layer 1: Background Image or Video */}
           <div className="absolute inset-0">
                {isVideo ? (
                    <video
                        key={heroImage} // Key helps React re-mount the video element
                        src={heroImage}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover object-center"
                        onTimeUpdate={(e) => {
                            const video = e.currentTarget;
                            // Check for duration to avoid NaN issues on load
                            if (!isNaN(video.duration) && !transitionTriggeredRef.current && (video.duration - video.currentTime) <= 2) {
                                transitionTriggeredRef.current = true;
                                handleNext();
                            }
                        }}
                    />
                ) : (
                    <img
                        src={heroImage}
                        alt={current.title || current.name}
                        className="w-full h-full object-cover object-center"
                    />
                )
            }
                
                 {/* Vignette / Gradients */}
                 
                 {/* 1. Left Gradient (Main Text Backdrop) */}
                 <div className="absolute inset-y-0 left-0 w-full md:w-[60%] bg-gradient-to-r from-[#050505]/95 via-[#050505]/70 to-transparent" />
                 
                 {/* 2. Top Gradient (Navbar Visibility) */}
                 <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#050505]/80 to-transparent" />
           </div>

          {/* Layer 2: Content Container - CHANGED: items-center to items-end for bottom alignment */}
          <div className="absolute inset-0 flex items-end justify-start z-30 pointer-events-none">
            {/* Added bottom padding to lift content off the edge */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-12 w-full pb-8 md:pb-24 pointer-events-auto">
              <div className="max-w-2xl flex flex-col items-start text-left relative z-40">
                
                {/* Brand/Logo Area (Title) */}
                {config.showTitle && (
                    <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-2 md:mb-4"
                    >
                        {/* Render Title with Dynamic Styles */}
                        <h1 
                            className={`${getTitleSizeClasses(config.titleSize)} font-black leading-[0.9] uppercase tracking-tighter font-display mb-1 md:mb-2 line-clamp-2 drop-shadow-xl`}
                            style={{ color: config.titleColor }}
                        >
                            {current.title || current.name}
                        </h1>
                    </motion.div>
                )}

                {/* Metadata Tags */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6 text-[9px] md:text-xs font-bold text-zinc-300 uppercase tracking-widest drop-shadow-md"
                >
                  <span className="text-brand-400 flex items-center gap-1">
                     <AudioWaveform className="w-3 h-3" />
                     {current.type || 'Series'}
                  </span>
                  <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                  <span className="text-zinc-300">{current.year || '2024'}</span>
                  <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                  <div className="flex gap-1">
                     <span className="px-1.5 py-0.5 bg-zinc-800/80 border border-zinc-700 rounded-sm text-zinc-400">SUB</span>
                     <span className="px-1.5 py-0.5 bg-zinc-800/80 border border-zinc-700 rounded-sm text-zinc-400">DUB</span>
                  </div>
                </motion.div>

                {/* Description REMOVED as requested */}

                {/* Action Buttons */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-2 md:gap-3 w-full md:w-auto"
                >
                  <Link
                    to={`/watch/${encodeURIComponent(current.id)}`}
                    className="flex-1 md:flex-none h-9 md:h-12 px-4 md:px-8 bg-brand-400 hover:bg-white hover:text-black text-black font-black uppercase tracking-widest transition-all skew-x-[-12deg] flex items-center justify-center gap-2 group/btn shadow-[0_0_20px_rgba(255,0,51,0.2)]"
                  >
                    <Play className="w-3.5 h-3.5 md:w-5 md:h-5 fill-black skew-x-[12deg] group-hover/btn:scale-110 transition-transform" />
                    <span className="text-[10px] md:text-sm skew-x-[12deg] whitespace-nowrap pt-0.5">Start Watching</span>
                  </Link>
                  
                  <button className="h-9 md:h-12 w-10 md:w-14 flex items-center justify-center border-2 border-brand-400/50 bg-black text-brand-400 hover:bg-brand-400 hover:text-black hover:border-brand-400 transition-all skew-x-[-12deg] group/bm">
                     <Plus className="w-4 h-4 md:w-6 md:h-6 skew-x-[12deg] group-hover/bm:scale-110 transition-transform" />
                  </button>
                </motion.div>

              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation Indicators - Position Updated */}
      <div className="absolute right-4 bottom-12 md:right-6 md:bottom-16 z-40 flex flex-col gap-2">
          {displayItems.map((item: Anime, idx: number) => (
              <button 
                  key={`${item.id}-${idx}`}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-brand-400 h-4 md:h-6' : 'bg-white/30 hover:bg-white'}`}
              />
          ))}
      </div>
    </div>
  );
};