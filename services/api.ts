
import { useQuery, useInfiniteQuery, UseQueryOptions } from "@tanstack/react-query";
import axios from "axios";
import { ApiResponse } from "../types";

// Default Configuration
export const DEFAULT_CONFIG = {
  baseUrl: "https://aniwatchapi-seven-teal.vercel.app/aniwatch",
  apiKey: "", // For Anime Backend
  geminiApiKey: "", // For Google Gemini AI
  endpoints: {
    home: "/", // Fetch home page data from base URL
    search: "/search?keyword={q}&page={page}", // New search structure
    details: "/anime/{id}", 
    episodes: "/episodes/{id}", 
    servers: "/servers?id={id}",
    sources: "/episode-srcs?id={id}&server={server}&category={category}",
    suggestion: "/search/suggest?keyword={q}", 
    genres: "/genres", // Fetch list of genres
    genre: "/genre/{id}", // Fetch specific genre data
    schedule: "/schedule?date={date}", // Fetch schedule data
  }
};

export const getConfig = () => {
  try {
    const stored = localStorage.getItem("api_config");
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Force update if old hianime endpoints are detected
      if (parsed.endpoints && Object.values(parsed.endpoints).some((v: any) => typeof v === 'string' && v.includes('hianime'))) {
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
        path = `${path}?keyword=${encodeURIComponent(query)}`;
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
    const { data } = await axios.get<ApiResponse<T>>(proxyUrl, requestOptions);
    return data;
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
