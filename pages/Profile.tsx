import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProgress, UserProgress, removeUserProgress, auth } from '../services/firebase';
import { updateProfile } from 'firebase/auth';
import { ProfileAnimeCard } from '../components/ProfileAnimeCard';
import { LogOut, LoaderCircle, History, CheckCircle, Bookmark, AlertTriangle, PlayCircle, Trophy, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const Profile: React.FC = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'watching' | 'saved' | 'completed'>('watching');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      if (user) {
        try {
          const data = await getUserProgress(user.uid);
          const progressArray = Object.values(data).sort((a, b) => b.lastUpdated - a.lastUpdated);
          setProgressData(progressArray);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      } else if (!authLoading) {
        navigate('/login');
      }
    };
    fetchData();
  }, [user, authLoading, navigate]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'My smallest server'); 
        formData.append('cloud_name', 'dj5hhott5');

        const res = await fetch('https://api.cloudinary.com/v1_1/dj5hhott5/image/upload', {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error("Upload failed");
        
        const data = await res.json();
        const photoURL = data.secure_url;

        // Update Firebase Auth Profile
        await updateProfile(user, { photoURL });
        
        // Force refresh to show new image
        window.location.reload(); 
    } catch (e) {
        console.error(e);
        setError("Failed to update profile picture");
    } finally {
        setUploading(false);
    }
  };

  const handleDelete = async (animeId: string) => {
    if (!user) return;
    try {
        await removeUserProgress(user.uid, animeId);
        // Optimistic UI update
        setProgressData(prev => prev.filter(p => p.animeId !== animeId));
    } catch (e) {
        console.error(e);
        setError("Failed to remove item");
    }
  };

  if (authLoading || loading) {
    return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center">
            <LoaderCircle className="w-10 h-10 text-brand-400 animate-spin" />
        </div>
    );
  }

  if (!user) return null;

  // Filter lists
  const watchingList = progressData.filter(p => p.status === 'Watching');
  const completedList = progressData.filter(p => p.status === 'Completed');
  const savedList = progressData.filter(p => p.status === 'On Hold');

  return (
    <div className="min-h-screen bg-dark-950 pb-24 md:pb-20">
      
      {/* Banner & Header Area */}
      <div className="relative bg-dark-900 border-b border-dark-700">
          {/* Abstract Banner Background */}
          <div className="absolute inset-0 overflow-hidden h-48 md:h-72">
               <div className="absolute inset-0 bg-gradient-to-b from-brand-900/30 via-dark-900 to-dark-950" />
               <div className="absolute inset-0 opacity-20 bg-[url('https://res.cloudinary.com/dj5hhott5/image/upload/v1739502930/noise_tij0m3.png')] mix-blend-overlay" />
          </div>

          <div className="max-w-7xl mx-auto px-4 pt-24 md:pt-40 pb-6 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8 text-center md:text-left">
               
               {/* Avatar */}
               <div className="relative group shrink-0">
                   <div className="w-24 h-24 md:w-36 md:h-36 rounded-full border-4 border-dark-950 shadow-2xl overflow-hidden bg-dark-800 relative z-20 group">
                       {uploading ? (
                           <div className="w-full h-full flex items-center justify-center bg-black/80">
                               <LoaderCircle className="w-8 h-8 text-brand-400 animate-spin" />
                           </div>
                       ) : user.photoURL ? (
                           <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                           <div className="w-full h-full bg-brand-400 flex items-center justify-center">
                               <span className="text-3xl md:text-5xl font-black text-black uppercase">
                                   {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                               </span>
                           </div>
                       )}
                       
                       {/* Upload Overlay */}
                       <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                           <Camera className="w-8 h-8 text-white" />
                           <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                       </label>
                   </div>
                   <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-4 h-4 md:w-6 md:h-6 bg-green-500 border-4 border-dark-900 rounded-full z-30" title="Online" />
               </div>

               {/* User Info */}
               <div className="flex-1 min-w-0 w-full">
                   <h1 className="text-2xl md:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-1 md:mb-2 truncate drop-shadow-lg">
                       {user.displayName || user.email?.split('@')[0]}
                   </h1>
                   <div className="flex items-center justify-center md:justify-start gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400">
                       <span className="text-brand-400 px-2 py-0.5 bg-brand-400/10 rounded border border-brand-400/20">Pro Member</span>
                       <span className="w-1 h-1 bg-zinc-600 rounded-full" />
                       <span className="truncate max-w-[200px]">{user.email}</span>
                   </div>
               </div>

               {/* Stats Row - Removed "Eps Watched" */}
               <div className="grid grid-cols-2 gap-0 w-full md:w-auto bg-dark-950/60 backdrop-blur-md rounded-lg border border-white/5 overflow-hidden shadow-xl mt-4 md:mt-0">
                   <div className="text-center p-3 md:px-6 md:py-4 hover:bg-white/5 transition-colors cursor-default">
                       <div className="text-lg md:text-2xl font-black text-white leading-none">{watchingList.length}</div>
                       <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Watching</div>
                   </div>
                   <div className="text-center p-3 md:px-6 md:py-4 border-l border-white/5 hover:bg-white/5 transition-colors cursor-default">
                       <div className="text-lg md:text-2xl font-black text-white leading-none">{savedList.length}</div>
                       <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-bold tracking-wider mt-1">Saved</div>
                   </div>
               </div>

               {/* Logout Button - HIDDEN ON MOBILE (md:block) */}
               <button 
                    onClick={logout}
                    className="hidden md:block md:ml-4 p-3 bg-dark-800/80 hover:bg-red-500 hover:text-white text-zinc-400 border border-dark-600 hover:border-red-500 transition-all rounded-full backdrop-blur-sm z-50 shadow-lg group"
                    title="Logout"
                >
                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 md:px-4 mt-6">
        
        {/* Error Display */}
        {error && (
            <div className="bg-red-900/20 border border-red-500/30 p-4 text-center my-4 rounded-md mx-auto max-w-md">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2"/>
                <p className="text-zinc-400 text-xs font-mono">{error}</p>
            </div>
        )}

        {/* Tabs - Full width on mobile */}
        {!error && (
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5 }}
          >
            <div className="flex border-b border-dark-700 mb-6 sticky top-14 md:top-20 z-30 bg-dark-950/95 backdrop-blur-sm pt-2">
                <TabButton 
                    active={activeTab === 'watching'} 
                    onClick={() => setActiveTab('watching')} 
                    icon={History} 
                    label="Continue" 
                    count={watchingList.length} 
                />
                <TabButton 
                    active={activeTab === 'saved'} 
                    onClick={() => setActiveTab('saved')} 
                    icon={Bookmark} 
                    label="Saved" 
                    count={savedList.length} 
                />
                <TabButton 
                    active={activeTab === 'completed'} 
                    onClick={() => setActiveTab('completed')} 
                    icon={CheckCircle} 
                    label="Done" 
                    count={completedList.length} 
                />
            </div>

            <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                    {activeTab === 'watching' && (
                        <motion.div 
                            key="watching"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {watchingList.length === 0 ? (
                                <EmptyState message="No ongoing anime." action={() => navigate('/')} actionText="Start Watching" />
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                                    {watchingList.map((p: UserProgress) => (
                                        <ProfileAnimeCard key={p.animeId} progress={p} onDelete={handleDelete} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'saved' && (
                        <motion.div 
                            key="saved"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {savedList.length === 0 ? (
                                <EmptyState message="Watchlist is empty." action={() => navigate('/')} actionText="Browse Anime" />
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                                    {savedList.map((p: UserProgress) => (
                                        <ProfileAnimeCard key={p.animeId} progress={p} onDelete={handleDelete} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'completed' && (
                        <motion.div 
                            key="completed"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {completedList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-dark-700 bg-dark-900/50 rounded-lg">
                                    <Trophy className="w-10 h-10 text-zinc-700 mb-4" />
                                    <p className="text-zinc-500 font-bold uppercase text-xs">No completed anime yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
                                    {completedList.map((p: UserProgress) => (
                                        <ProfileAnimeCard key={p.animeId} progress={p} onDelete={handleDelete} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- Helper Components ---

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ElementType; label: string; count: number }> = ({ active, onClick, icon: Icon, label, count }) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-3 md:py-4 text-[10px] md:text-sm font-bold uppercase tracking-widest transition-all border-b-2 flex items-center justify-center gap-2 relative ${
            active ? 'border-brand-400 text-white bg-white/5' : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
        }`}
    >
        <Icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${active ? 'text-brand-400' : ''}`} /> 
        <span>{label}</span>
        {count > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded text-[9px] ${active ? 'bg-brand-400 text-black' : 'bg-dark-800 text-zinc-500'}`}>
                {count}
            </span>
        )}
    </button>
);

const EmptyState: React.FC<{ message: string, action: () => void, actionText: string }> = ({ message, action, actionText }) => (
    <div className="flex flex-col items-center justify-center h-64 border border-dashed border-dark-700 bg-dark-900/30 rounded-lg">
        <PlayCircle className="w-10 h-10 text-zinc-700 mb-4" />
        <p className="text-zinc-400 font-bold uppercase text-xs mb-4 tracking-widest">{message}</p>
        <button onClick={action} className="px-6 py-2.5 bg-brand-400 hover:bg-white text-black font-black uppercase text-xs skew-x-[-12deg] transition-all shadow-[0_0_15px_rgba(255,0,51,0.2)] hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            <span className="skew-x-12 block">{actionText}</span>
        </button>
    </div>
);