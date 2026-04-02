import React from 'react';
import { useApi, constructUrl } from '../services/api';
import { ScheduleResponse, ScheduleItem } from '../types';
import { motion } from 'framer-motion';
import { CalendarDays, ChevronRight, AlertTriangle, PlayCircle, Hash } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ScheduleSkeleton } from '../components/Skeletons';

const ScheduleCard: React.FC<{ item: ScheduleItem, index: number, isLast: boolean }> = ({ item, index, isLast }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex gap-4 md:gap-8 relative pl-6 md:pl-8 ${!isLast ? 'pb-8 md:pb-12' : ''}`}
        >
            {/* Timeline Line */}
            {!isLast && (
                <div className="absolute left-[11px] md:left-[15px] top-3 bottom-0 w-[1px] bg-gradient-to-b from-brand-400 via-white/10 to-transparent" />
            )}
            
            {/* Timeline Dot */}
            <div className="absolute left-[6px] md:left-[10px] top-1.5 w-3 h-3 rounded-full bg-dark-950 border-2 border-brand-400 z-10 shadow-[0_0_10px_rgba(255,0,51,0.5)] group-hover:scale-125 transition-transform" />

            {/* Time Column */}
            <div className="w-16 md:w-24 flex-shrink-0 flex flex-col items-start pt-0.5">
                <span className="text-xl md:text-2xl font-black text-white font-mono tracking-tighter leading-none">
                    {item.airingTime}
                </span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    JST
                </span>
            </div>

            {/* Content Card */}
            <div className="flex-1 min-w-0">
                <Link 
                    to={`/anime/${item.id}`} 
                    className="block bg-dark-900/50 hover:bg-dark-800 border border-white/5 hover:border-brand-400/50 p-5 transition-all group relative overflow-hidden rounded-sm"
                >
                    {/* Hover Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/0 to-brand-400/5 group-hover:via-brand-400/5 transition-all duration-500" />
                    
                    <div className="relative z-10 flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-bold text-white truncate group-hover:text-brand-400 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-sm text-zinc-400 truncate font-medium mt-1">
                                {item.japaneseTitle}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-4">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-400/10 border border-brand-400/20 rounded-sm text-xs font-bold text-brand-400 font-mono">
                                    <Hash className="w-3 h-3" />
                                    {item.airingEpisode.replace('Episode ', 'EP ')}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 border border-white/5 rounded-sm text-xs font-bold text-zinc-400 uppercase tracking-wider group-hover:bg-zinc-700 transition-colors">
                                    <PlayCircle className="w-3 h-3" />
                                    Watch
                                </span>
                            </div>
                        </div>

                        <div className="flex-shrink-0 self-center hidden sm:block">
                            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-brand-400 group-hover:bg-brand-400 transition-all transform group-hover:rotate-[-45deg]">
                                <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-black transition-colors" />
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </motion.div>
    );
};


export const Schedule: React.FC = () => {
  const { data: scheduleResponse, isLoading, error } = useApi<ScheduleResponse>(constructUrl('schedule'));
  const schedule = scheduleResponse?.results || [];

  return (
    <div className="min-h-screen bg-dark-950 pt-24 px-4 pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-400/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-12">
            <h1 className="text-4xl md:text-6xl font-black text-white italic font-display uppercase tracking-tighter flex items-center gap-3 mb-2">
                <CalendarDays className="w-8 h-8 md:w-12 md:h-12 text-brand-400" />
                <span>On <span className="text-brand-400">Air</span></span>
            </h1>
            <p className="text-zinc-400 font-sans text-sm md:text-base max-w-lg border-l-2 border-brand-400 pl-4 ml-2">
                Stay up to date with the latest episodes airing today in Japan. Times are displayed in JST.
            </p>
        </div>

        {isLoading ? (
            <ScheduleSkeleton />
        ) : error ? (
            <div className="flex flex-col items-center text-center py-20 bg-red-900/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-white uppercase">Failed to Load Schedule</h2>
                <p className="text-zinc-400 mt-2 font-mono text-sm">{error.message}</p>
            </div>
        ) : schedule.length > 0 ? (
            <div className="space-y-0">
                {schedule.map((item: ScheduleItem, idx: number) => (
                    <ScheduleCard key={item.id} item={item} index={idx} isLast={idx === schedule.length - 1} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-dark-900 border border-dark-700 rounded-lg">
                <p className="text-zinc-500 font-bold uppercase tracking-widest">No schedule data available for today.</p>
            </div>
        )}
      </div>
    </div>
  );
};