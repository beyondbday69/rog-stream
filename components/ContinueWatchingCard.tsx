import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi, constructUrl } from '../services/api';
import { UserProgress } from '../services/firebase';
import { AnimeDetail } from '../types';
import { ContinueWatchingCardSkeleton } from './Skeletons';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContinueWatchingCardProps {
  progress: UserProgress;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({ progress }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  // Fetch fresh details for the anime to ensure poster/title are up to date
  const { data: anime, isLoading } = useApi<AnimeDetail>(
    constructUrl('details', { id: progress.animeId })
  );

  if (isLoading || !anime) {
    return <ContinueWatchingCardSkeleton />;
  }

  const progressPercentage = progress.totalEpisodes > 0 
    ? (progress.currentEpisode / progress.totalEpisodes) * 100 
    : 0;

  // Use the next episode ID from progress if available, otherwise link to the anime detail page
  const watchLink = progress.nextEpisodeId 
    ? `/watch/${encodeURIComponent(progress.nextEpisodeId)}` 
    : `/anime/${progress.animeId}`;

  const posterImage = anime.poster || anime.image || progress.poster; // Use fresh data with fallback
  const animeTitle = anime.title || progress.title; // Use fresh data with fallback

  return (
    <div className="w-[280px] md:w-[320px] flex-shrink-0 group snap-start relative">
      <Link to={watchLink} className="block">
        <div className="relative aspect-video bg-dark-800 overflow-hidden rounded-sm border border-white/5 group-hover:border-brand-400/50 transition-all">
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoaded ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            onLoad={() => setIsLoaded(true)}
            src={posterImage}
            alt={animeTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none">
            <div className="w-10 h-10 rounded-full bg-black/80 border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-brand-400 group-hover:border-brand-400 transition-all">
              <Play className="w-4 h-4 fill-white text-white group-hover:fill-black group-hover:text-black ml-0.5" />
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-0.5 line-clamp-1">
              {animeTitle}
            </h4>
            <h3 className="text-brand-400 font-bold text-sm uppercase">
              Watched Ep. {progress.currentEpisode}
            </h3>
          </div>
          
          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div className="h-full bg-brand-400" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
      </Link>
    </div>
  );
};