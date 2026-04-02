
// Generic API Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface Anime {
  id: string;
  title: string;
  name?: string; // Fallback for title
  poster: string;
  img?: string; // Fallback for poster
  image?: string; // Add image as fallback for poster
  banner?: string;
  description?: string;
  synopsis?: string;
  rank?: number;
  type?: string;
  duration?: string;
  quality?: string;
  rating?: string;
  episodes?: {
    sub: number;
    dub: number;
    eps?: number;
  };
  episodesCount?: number;
  year?: string | number;
  posterType?: 'image' | 'video'; // Added for Hero Video Support
}

export interface HistoryItem {
  animeId: string;
  episodeId: string;
  title: string;
  episodeNumber: number;
  image: string;
  timestamp: number;
}

export interface HomeData {
  spotlight: Anime[];
  trending: Anime[];
  latestEpisode: Anime[];
  topUpcoming: Anime[];
  top10: {
    day: Anime[];
    week: Anime[];
    month: Anime[];
  };
  topAiring: Anime[];
  // Keep legacy keys optional if API structure varies
  spotlightAnimes?: Anime[];
  spotLightAnimes?: Anime[]; // Added to match API
  trendingAnimes?: Anime[];
  latestEpisodeAnimes?: Anime[];
  latestEpisodes?: Anime[]; // Added to match API
  topUpcomingAnimes?: Anime[];
  top10Animes?: {
    day: Anime[];
    week: Anime[];
    month: Anime[];
  };
  topAiringAnimes?: Anime[];
  featuredAnimes?: {
    topAiringAnimes: Anime[];
    mostPopularAnimes: Anime[];
    mostFavoriteAnimes: Anime[];
    latestCompletedAnimes: Anime[];
  };
}

export interface Episode {
  id: string;
  episodeId?: string; // Legacy fallback
  title: string;
  number: number;
  isFiller: boolean;
  isSubbed?: boolean;
  isDubbed?: boolean;
  url?: string;
}

export interface AnimeDetail {
  id: string;
  title: string;
  malID?: number;
  alID?: number;
  japaneseTitle?: string;
  image: string;
  description: string;
  type: string;
  url: string;
  recommendations: Anime[];
  relatedAnime: Anime[];
  subOrDub?: string;
  hasSub?: boolean;
  hasDub?: boolean;
  genres?: string[];
  status?: string;
  season?: string;
  totalEpisodes?: number;
  episodes: Episode[];
  banner?: string;
  poster?: string; // Fallback
  malScore?: string;
  moreInfo?: Record<string, string>;
}

export interface EpisodeList {
  totalEpisodes: number;
  episodes: Episode[];
}

export interface Server {
  serverName: string;
  serverId: number | string;
}

export interface ServerData {
  episodeId: string;
  episodeNo: number;
  sub: Server[];
  dub: Server[];
  raw: Server[];
}

export interface StreamSource {
  url: string;
  isM3U8: boolean;
  quality?: string;
}

export interface StreamData {
  headers: {
    Referer: string;
    "User-Agent"?: string;
  };
  sources: StreamSource[];
}

export interface SearchResult {
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  results: Anime[];
  // Legacy optional properties in case of mixed usage
  animes?: Anime[];
  response?: Anime[];
  pageInfo?: {
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
  };
}

export interface CategoryResult {
  animes?: Anime[];
  response?: Anime[];
  results?: Anime[]; // Added results support
  currentPage: number;
  hasNextPage: boolean;
  totalPages: number;
  pageInfo?: {
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
  };
}

// New Schedule Types
export interface ScheduleItem {
  id: string;
  title: string;
  japaneseTitle: string;
  url: string;
  airingEpisode: string;
  airingTime: string;
}

export interface ScheduleResponse {
  results: ScheduleItem[];
}


// New Type for AI Chat
export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}
