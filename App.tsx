import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigationType, Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Lenis from '@studio-freight/lenis';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { AnimeDetail } from './pages/AnimeDetail';
import { Watch } from './pages/Watch';
import { Schedule } from './pages/Schedule';
import { Search } from './pages/Search';
import { Regional } from './pages/Regional';
import { RegionalAnimeDetail } from './pages/RegionalAnimeDetail';
import { RegionalWatch } from './pages/RegionalWatch';
import { Category } from './pages/Category';
import { Genres } from './pages/Genres';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';
import { Benefits } from './pages/Benefits';
import { Profile } from './pages/Profile';
import { Documentation } from './pages/Documentation';
import { ApiDocs } from './pages/ApiDocs'; 
import { Trackpad } from './components/Trackpad';
import { AuthProvider } from './context/AuthContext';

// ScrollToTop Component
const ScrollToTop = () => {
    const location = useLocation();
    const navType = useNavigationType();
  
    useEffect(() => {
      // Only scroll to top if PUSHing to a new route. 
      // On POP (Back button), let the browser restore scroll position.
      if (navType !== 'POP') {
        window.scrollTo(0, 0);
      }
    }, [location.pathname, navType]);
  
    return null;
};

const AppRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/benefits" element={<Benefits />} />
                <Route path="/documentation" element={<Documentation />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/anime/:id" element={<AnimeDetail />} />
                <Route path="/watch/:animeId/:episodeNumber" element={<Watch />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/search" element={<Search />} />
                <Route path="/regional" element={<Regional />} />
                <Route path="/regional/anime/:id" element={<RegionalAnimeDetail />} />
                <Route path="/regional/watch/:animeId/:episodeNumber" element={<RegionalWatch />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/animes/:category" element={<Category />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </AnimatePresence>
    );
};

const App: React.FC = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Trackpad />
        
        {/* Main Layout Container */}
        <div className="min-h-[100dvh] bg-dark-950 text-zinc-100 font-sans selection:bg-brand-500 selection:text-white flex flex-col overflow-x-hidden animate-in fade-in duration-700">
            
            <Navbar />
            
            <div className="flex-grow"> 
                <AppRoutes />
            </div>
            
            <footer className="bg-dark-900 border-t border-brand-400/20 py-12 mt-auto block relative overflow-hidden pb-32">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-50"></div>
                <div className="max-w-7xl mx-auto px-4 text-center">
                <h2 className="text-3xl font-black text-white mb-4 font-display italic tracking-tighter">
                    <span className="text-brand-400">STREAMING</span>
                </h2>
                <p className="text-zinc-500 text-sm max-w-md mx-auto mb-8 font-mono">
                    PREMIUM ANIME EXPERIENCE.
                </p>
                <div className="flex justify-center gap-6 mb-8">
                    <Link to="/benefits" className="text-zinc-500 hover:text-brand-400 text-xs font-bold uppercase tracking-widest transition-colors">Why Join?</Link>
                    <Link to="/documentation" className="text-zinc-500 hover:text-brand-400 text-xs font-bold uppercase tracking-widest transition-colors">How It Works</Link>
                    <Link to="/api-docs" className="text-zinc-500 hover:text-brand-400 text-xs font-bold uppercase tracking-widest transition-colors">API Docs</Link>
                    <Link to="/admin" className="text-zinc-500 hover:text-brand-400 text-xs font-bold uppercase tracking-widest transition-colors">Config</Link>
                </div>
                <div className="text-zinc-600 text-xs font-bold uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} ALL RIGHTS RESERVED.
                </div>
                </div>
            </footer>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;