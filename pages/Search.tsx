import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApi, constructUrl } from '../services/api';
import { SearchResult } from '../types';
import { AnimeCard } from '../components/AnimeCard';
import { AnimeCardSkeleton } from '../components/Skeletons';
import { ArrowLeft, ArrowRight, Search as SearchIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  
  // constructUrl will replace {keyword} with the query
  const searchUrl = query ? constructUrl('search', { q: query, page }) : '';

  const { data: searchResult, isLoading } = useApi<SearchResult>(searchUrl);

  // Removed useEffect window.scrollTo to let App.tsx handle it conditionally

  const handlePageChange = (newPage: number) => {
    setSearchParams({ q: query, page: newPage.toString() });
    // For pagination within same route, we might want to scroll top
    window.scrollTo(0, 0);
  };

  // Support new 'results' array and legacy fallback keys
  const results = searchResult?.results || searchResult?.response || searchResult?.animes || [];
  const hasNextPage = searchResult?.hasNextPage ?? searchResult?.pageInfo?.hasNextPage ?? false;
  const totalPages = searchResult?.totalPages ?? searchResult?.pageInfo?.totalPages ?? 1;

  // Recommended Genres for empty state
  const genres = ["Action", "Romance", "Fantasy", "Drama", "Sci-Fi", "Comedy"];

  return (
    <div className="min-h-screen bg-dark-900 pt-20 md:pt-24 px-3 md:px-4 pb-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Results Header */}
        {query && (
            <div className="mb-6 md:mb-8 border-b border-white/5 pb-4">
                <h1 className="text-xl md:text-2xl text-white font-bold uppercase tracking-wide">
                    Results for <span className="text-brand-400">"{query}"</span>
                </h1>
                <p className="text-zinc-500 text-xs md:text-sm font-mono mt-1">Found {results.length} matches</p>
            </div>
        )}

        {/* Quick Genres for empty state only */}
        {!query && (
            <div className="mt-8">
                <h2 className="text-zinc-500 font-bold mb-4 uppercase text-sm tracking-widest">Browse Categories</h2>
                <div className="flex flex-wrap gap-3">
                    {genres.map((genre: string) => (
                        <button 
                            key={genre}
                            onClick={() => navigate(`/animes/${genre.toLowerCase()}`)}
                            className="px-6 py-3 bg-zinc-800 hover:bg-brand-400 hover:text-black border border-white/5 rounded-sm text-zinc-400 font-bold uppercase tracking-wider transition-all skew-x-[-10deg]"
                        >
                            <span className="skew-x-[10deg] block">{genre}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-6">
             {[...Array(12)].map((_: any, i: number) => <AnimeCardSkeleton key={i} />)}
          </div>
        ) : (
          <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-6">
              {results.map((anime: any) => (
                <AnimeCard key={anime.id} anime={anime} layout="grid" />
              ))}
            </div>

            {results.length === 0 && query && (
                <div className="text-center text-zinc-500 py-32 flex flex-col items-center bg-zinc-800/20 border border-dashed border-white/10 rounded-lg">
                  <div className="bg-zinc-800 p-6 mb-4 rounded-full">
                     <SearchIcon className="w-10 h-10 opacity-30" />
                  </div>
                  <p className="text-xl font-bold text-white mb-2 uppercase tracking-wider">No matches found</p>
                  <p className="text-sm">We couldn't find anything matching "{query}"</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="flex justify-center items-center gap-4 mt-16 pb-10">
                <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="p-3 bg-zinc-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-400 hover:text-black transition-colors skew-x-[-10deg] border border-white/10"
                >
                    <ArrowLeft className="w-5 h-5 skew-x-[10deg]" />
                </button>
                
                <span className="text-white font-bold bg-zinc-900 px-8 py-3 border border-white/10 text-sm font-mono skew-x-[-10deg]">
                    <span className="skew-x-[10deg]">{page} / {totalPages}</span>
                </span>

                <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={!hasNextPage && page >= totalPages}
                    className="p-3 bg-zinc-800 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-400 hover:text-black transition-colors skew-x-[-10deg] border border-white/10"
                >
                    <ArrowRight className="w-5 h-5 skew-x-[10deg]" />
                </button>
                </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}