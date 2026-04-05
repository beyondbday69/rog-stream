import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, AlignRight, X, CircleUser, BellRing, Compass, CalendarDays, TrendingUp, Settings2, LogIn, Home, LogOut, ChevronLeft, Crown, Info, FileCode2, Clapperboard, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollRatio, setScrollRatio] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Handle Scroll Effect using Framer Motion to avoid direct window.scrollY access
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
    const ratio = Math.min(latest / 150, 1);
    setScrollRatio(ratio);
  });

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsMobileOpen(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Trending', path: '/animes/trending' },
    { name: 'Genres', path: '/genres' }, 
    { name: 'Schedule', path: '/schedule' },
    { name: 'Movies', path: '/animes/movie' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 h-14 md:h-20"
      >
        {/* Background Layer - Dynamic Opacity for PC */}
        <div 
            className="absolute inset-0 bg-black hidden md:block transition-shadow duration-300"
            style={{ 
                opacity: scrollRatio,
                borderBottom: `1px solid rgba(255, 255, 255, ${scrollRatio * 0.05})`,
                boxShadow: scrollRatio > 0.8 ? '0 10px 15px -3px rgb(0 0 0 / 0.3)' : 'none'
            }} 
        />
        
        {/* Gradient Overlay - Mobile and Initial Top State */}
        <div 
            className="absolute inset-0 bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-500 md:hidden" 
            style={{ opacity: isScrolled ? 1 : 0.8 }}
        />
        
        {/* Subtle top gradient for PC when at the top for visibility */}
        <div 
            className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent hidden md:block pointer-events-none transition-opacity duration-300"
            style={{ opacity: 1 - scrollRatio }}
        />

        <div className="relative z-20 max-w-[1600px] mx-auto px-3 md:px-8 h-full">
          <div className="flex items-center h-full gap-3 md:gap-8">
            
            {/* Left: Logo & Nav */}
            <div className="hidden md:flex items-center gap-12 flex-shrink-0">
              
              {/* Logo */}
              <Link to="/" className="text-white hover:text-brand-400 transition-colors transform hover:scale-110 duration-200 block">
                <Home className="w-6 h-6 md:w-8 md:h-8" strokeWidth={2.5} />
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`relative px-6 py-2 text-sm font-bold uppercase tracking-wider transition-all skew-x-[-12deg] border-l-2 border-transparent hover:border-brand-400 hover:bg-brand-400/10 ${
                      isActive(link.path) ? 'text-brand-400 border-brand-400 bg-brand-400/10 shadow-[inset_0_0_10px_rgba(255,0,51,0.2)]' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className="block skew-x-[12deg]">{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Center: Search - Stretched on Mobile */}
            <div className="flex flex-1 items-center justify-start md:justify-end max-w-4xl mx-auto">
              <form onSubmit={handleSearch} className="w-full relative group mt-0 md:mt-3">
                <div className={`relative flex items-center border rounded-none px-3 py-1.5 md:px-4 md:py-2 transition-all duration-300 group-focus-within:border-brand-400 skew-x-[-12deg] w-full ${isScrolled ? 'bg-black border-zinc-800' : 'bg-black/60 border-white/10 backdrop-blur-sm'}`}>
                  <Search className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-500 skew-x-[12deg] group-focus-within:text-brand-400 transition-colors flex-shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="SEARCH..."
                    className="bg-transparent border-none outline-none text-xs md:text-base text-white placeholder-zinc-600 ml-2 md:ml-3 w-full skew-x-[12deg] font-mono tracking-wider uppercase"
                  />
                  {/* Subtle Corner Accents */}
                  <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-brand-400 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-brand-400 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                </div>
              </form>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 md:gap-6 flex-shrink-0 ml-auto md:ml-0">
              
              {/* Desktop Icons */}
              <div className="hidden md:flex items-center gap-6">
                
                {/* Benefits Link for Guests */}
                {!user && (
                  <Link to="/benefits" className="flex items-center gap-2 text-amber-400 hover:text-amber-200 transition-colors text-xs font-bold uppercase tracking-wider">
                      <Crown className="w-4 h-4" /> Go Pro
                  </Link>
                )}

                <button className="text-zinc-400 hover:text-brand-400 transition-colors relative group">
                    <BellRing className="w-5 h-5 group-hover:animate-ping absolute opacity-30" />
                    <BellRing className="w-5 h-5 relative z-10" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-400 rounded-none rotate-45 shadow-[0_0_5px_#ff0033]" />
                </button>
                <Link to="/admin" className="text-zinc-400 hover:text-brand-400 transition-colors">
                   <Settings2 className="w-5 h-5 hover:rotate-180 transition-transform duration-700" />
                </Link>
                
                {user ? (
                   <div className="flex items-center gap-3">
                      <Link to="/profile" className="flex flex-col items-end mr-1 hover:opacity-80 transition-opacity group">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider group-hover:text-brand-400">Profile</span>
                          <span className="text-xs font-bold text-white uppercase">{user.email?.split('@')[0]}</span>
                      </Link>
                      <button 
                        onClick={logout}
                        className="bg-zinc-800 hover:bg-brand-400 text-white hover:text-black p-2 transition-all skew-x-[-12deg]"
                        title="Logout"
                      >
                         <LogOut className="w-4 h-4 skew-x-[12deg]" />
                      </button>
                   </div>
                ) : (
                  <Link to="/login" className="flex items-center gap-2 bg-brand-400 hover:bg-white text-black px-6 py-2 text-xs font-black uppercase tracking-widest transition-all skew-x-[-12deg] clip-path-polygon hover:scale-105 shadow-[0_0_15px_rgba(255,0,51,0.4)]">
                      <span className="skew-x-[12deg] flex items-center gap-2">
                          <CircleUser className="w-4 h-4" /> Login
                      </span>
                  </Link>
                )}
              </div>

              {/* Mobile Toggle */}
              <button 
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden text-white p-1.5 md:p-2 hover:text-brand-400 transition-colors border border-white/10 bg-white/5 skew-x-[-10deg]"
              >
                <AlignRight className="w-5 h-5 md:w-6 md:h-6 skew-x-[10deg]" />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/90 z-50 lg:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-black border-l-2 border-brand-400 z-50 lg:hidden shadow-[0_0_50px_rgba(255,0,51,0.3)] overflow-y-auto"
            >
              <div className="p-6 relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-400/10 blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                  <span className="text-3xl font-display font-black text-white italic tracking-tighter">MENU</span>
                  <button 
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 text-zinc-400 hover:text-brand-400 transition-colors border border-white/10 hover:border-brand-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Mobile Links */}
                <div className="space-y-1">
                    <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-4 opacity-70 border-b border-brand-400/20 pb-1">Navigation Module</div>
                    
                    <Link to="/" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-brand-400 transition-all border-l-2 border-transparent hover:border-brand-400 group">
                        <Compass className="w-5 h-5 group-hover:rotate-45 transition-transform" />
                        <span className="font-bold uppercase tracking-wider">Home Base</span>
                    </Link>
                    <Link to="/genres" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-brand-400 transition-all border-l-2 border-transparent hover:border-brand-400 group">
                        <LayoutGrid className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-wider">Browse Genres</span>
                    </Link>
                    <Link to="/animes/trending" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-brand-400 transition-all border-l-2 border-transparent hover:border-brand-400 group">
                        <TrendingUp className="w-5 h-5 group-hover:text-orange-500 transition-colors" />
                        <span className="font-bold uppercase tracking-wider">Trending</span>
                    </Link>
                    <Link to="/schedule" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-brand-400 transition-all border-l-2 border-transparent hover:border-brand-400">
                        <CalendarDays className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-wider">Schedule</span>
                    </Link>
                    <Link to="/animes/movie" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-brand-400 transition-all border-l-2 border-transparent hover:border-brand-400">
                        <Clapperboard className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-wider">Movies</span>
                    </Link>
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 space-y-2">
                    <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-4 opacity-70 border-b border-brand-400/20 pb-1">System & Info</div>
                    
                    <Link to="/documentation" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-white transition-all border-l-2 border-transparent hover:border-white">
                        <Info className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-wider">How It Works</span>
                    </Link>
                    <Link to="/api-docs" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-white transition-all border-l-2 border-transparent hover:border-white">
                        <FileCode2 className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-wider">API Docs</span>
                    </Link>
                    <Link to="/admin" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-white transition-all border-l-2 border-transparent hover:border-white">
                        <Settings2 className="w-5 h-5" />
                        <span className="font-bold uppercase tracking-wider">Config</span>
                    </Link>
                    
                    {!user && (
                         <Link to="/benefits" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-amber-400 hover:text-white transition-all border-l-2 border-transparent hover:border-white">
                            <Crown className="w-5 h-5" />
                            <span className="font-bold uppercase tracking-wider">Benefits</span>
                        </Link>
                    )}
                    
                    {user ? (
                        <>
                            <Link to="/profile" className="flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-white transition-all border-l-2 border-transparent hover:border-white">
                                <CircleUser className="w-5 h-5" />
                                <span className="font-bold uppercase tracking-wider">Profile</span>
                            </Link>
                            <button onClick={logout} className="w-full flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-white transition-all text-left border-l-2 border-transparent hover:border-white">
                            <LogOut className="w-5 h-5" />
                            <span className="font-bold uppercase tracking-wider">Logout</span>
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="w-full flex items-center gap-4 p-4 hover:bg-brand-400/10 text-zinc-300 hover:text-white transition-all text-left border-l-2 border-transparent hover:border-white">
                            <LogIn className="w-5 h-5" />
                            <span className="font-bold uppercase tracking-wider">Authenticate</span>
                        </Link>
                    )}
                </div>
                
                {/* Decorative Bottom */}
                <div className="mt-12 p-4 bg-brand-400/10 border border-brand-400/30 rounded-none skew-x-[-5deg]">
                    <p className="text-brand-400 text-xs font-bold uppercase tracking-widest text-center flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-brand-400 animate-pulse shadow-[0_0_5px_#ff0033]"></span>
                        SYSTEM ONLINE
                    </p>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};