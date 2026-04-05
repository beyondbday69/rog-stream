import { useQuery, useInfiniteQuery, UseQueryOptions } from "@tanstack/react-query";
import axios from "axios";
import { ApiResponse } from "../types";

// Default Configuration
export const DEFAULT_CONFIG = {
  baseUrl: "https://animesalt-api-lovat.vercel.app/api",
  apiKey: "", // For Anime Backend
  geminiApiKey: "", // For Google Gemini AI
  endpoints: {
    home: "/home", 
    search: "/search?q={q}", 
    details: "/anime/{id}", 
    episodes: "/anime/{id}", 
    servers: "", // Not needed for AnimeSalt
    sources: "/episode/{id}", 
    suggestion: "/search?q={q}", 
    genres: "", // Not needed
    genre: "", // Not needed
    schedule: "", // Not needed
  }
};

export const getConfig = () => {
  try {
    const stored = localStorage.getItem("api_config");
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Force update if old hianime or aniwatch endpoints are detected
      if (parsed.endpoints && Object.values(parsed.endpoints).some((v: any) => typeof v === 'string' && (v.includes('hianime') || v.includes('aniwatch')))) {
        localStorage.removeItem("api_config");
        return DEFAULT_CONFIG;
      }
      
      // Force update if baseUrl doesn't match animesalt-api-lovat.vercel.app (since the user requested to update the API base URL explicitly and not use animelok or old ones)
      if (parsed.baseUrl && !parsed.baseUrl.includes('animesalt-api-lovat')) {
        localStorage.removeItem("api_config");
        return DEFAULT_CONFIG;
      }

      return {
        ...DEFAULT_CONFIG,
        ...parsed,
        endpoints: { ...DEFAULT_CONFIG.endpoints, ...parsed.endpoints }
      };
    }
  } catch (e) {
    console.error("Failed to parse config", e);
  }
  return DEFAULT_CONFIG;
};

export const getApiBaseUrl = () => getConfig().baseUrl;

// Helper to construct URLs dynamically
export const constructUrl = (key: keyof typeof DEFAULT_CONFIG.endpoints, params: Record<string, any> = {}) => {
  const config = getConfig();
  let path = config.endpoints[key] || DEFAULT_CONFIG.endpoints[key];

  // Create a copy of params to avoid mutating the original object
  const queryParams = { ...params };

  // 1. Handle Placeholders in path (e.g., {id}, {q}, {keyword}, {category})
  Object.keys(queryParams).forEach(paramKey => {
    const placeholder = `{${paramKey}}`;
    if (path.includes(placeholder)) {
      path = path.replace(placeholder, encodeURIComponent(String(queryParams[paramKey])));
      // Remove from queryParams so it's not appended as query param later
      delete queryParams[paramKey];
    }
  });

  // 2. Special handling for search/suggestion if no placeholders were used
  if ((key === 'search' || key === 'suggestion') && !path.includes('?')) {
     const query = queryParams.q || queryParams.keyword || '';
     if (query) {
        path = `${path}?q=${encodeURIComponent(query)}`;
        delete queryParams.q;
        delete queryParams.keyword;
     }
  }

  // 3. Append remaining params as query parameters
  const remainingKeys = Object.keys(queryParams).filter(k => queryParams[k] !== undefined && queryParams[k] !== null);
  if (remainingKeys.length > 0) {
    let separator = path.includes('?') ? '&' : '?';
    remainingKeys.forEach(k => {
      path = `${path}${separator}${k}=${encodeURIComponent(String(queryParams[k]))}`;
      separator = '&';
    });
  }

  return path;
};

export const fetchData = async <T>(url: string): Promise<ApiResponse<T>> => {
  const config = getConfig();
  
  // Prepare headers with API Key if available
  const requestOptions = {
    headers: {
        ...(config.apiKey ? { 'x-api-key': config.apiKey } : {})
    }
  };

  let targetUrl = url;
  
  // Support absolute URLs (overriding baseUrl)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
    const endpoint = url.startsWith('/') ? url : `/${url}`;
    targetUrl = `${baseUrl}${endpoint}`;
  }
  
  // Use proxy for all requests to avoid CORS
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
  
  try {
    console.log(`Fetching data via proxy: ${proxyUrl}`);
    const { data } = await axios.get<any>(proxyUrl, requestOptions);
    
    const mapAnime = (item: any) => {
        if (item) {
            if (item.slug && !item.id) item.id = item.slug;
            if (item.image && !item.poster) item.poster = item.image;
        }
        return item;
    };
    
    // Intercept AnimeSalt API Response Structure
    if (data && data.success && data.data) {
        const payload = data.data;
        
        // Map Home Data
        if (payload.fresh_drops) {
            payload.spotlight = payload.fresh_drops;
            payload.trending = payload['on-air_series_view_more'] || [];
            payload.topAiring = payload.new_anime_arrivals_view_more || [];
            payload.latestEpisode = payload.latest_anime_movies_view_more || [];
            payload.topUpcoming = payload.fresh_cartoon_films_view_more || [];
            payload.top10 = { week: payload['just_in:_cartoon_series_view_more'] || [] };
            
            [
              payload.spotlight, 
              payload.trending, 
              payload.topAiring, 
              payload.latestEpisode, 
              payload.topUpcoming, 
              payload.top10.week
            ].forEach(arr => {
                if (Array.isArray(arr)) arr.forEach(mapAnime);
            });
        }
        
        // Map Details & Episodes
        if (payload.episodes && Array.isArray(payload.episodes)) {
           payload.episodes.forEach((ep: any) => {
               if (!ep.id) ep.id = ep.url?.split('/').filter(Boolean).pop() || '';
           });
        }

        // Map details main attributes
        mapAnime(payload);
        
        // Return wrapped in expected structure
        return data as ApiResponse<T>;
    }

    // Map Search Data
    if (data && data.success && Array.isArray(data.results)) {
        data.results.forEach(mapAnime);
        // Optional: add missing properties searchResult expects
        if (!data.currentPage) data.currentPage = 1;
        if (!data.totalPages) data.totalPages = 1;
        if (data.hasNextPage === undefined) data.hasNextPage = false;
        
        return data as ApiResponse<T>;
    }

    return data as ApiResponse<T>;
  } catch (error) {
    console.error(`Error fetching data via proxy: ${proxyUrl}`, error);
    if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message);
    }
    throw new Error(String(error));
  }
};

export const useApi = <T>(
  endpointOrKey: string,
  options?: Omit<UseQueryOptions<ApiResponse<T>, Error, T, string[]>, 'queryKey' | 'queryFn' | 'select'>
) => {
  const config = getConfig();
  
  const finalEndpoint = endpointOrKey; 

  return useQuery({
    queryKey: [config.baseUrl, config.apiKey, finalEndpoint], // Include apiKey in cache key
    queryFn: () => fetchData<T>(finalEndpoint),
    select: (response: any) => response?.data || response, 
    retry: 1,
    enabled: !!finalEndpoint,
    refetchOnWindowFocus: false,
    ...options
  });
};
