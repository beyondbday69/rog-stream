import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const API_URL = 'https://backendweb-ivory.vercel.app/api/v1/home'; // Main data source
const BASE_URL = 'https://rog-stream.vercel.app';

// Static Routes to always include
const STATIC_ROUTES = [
  '/',
  '/login',
  '/profile',
  '/benefits',
  '/documentation',
  '/api-docs',
  '/schedule',
  '/search',
  '/genres',
  '/admin',
  '/animes/trending',
  '/animes/top-airing',
  '/animes/most-popular',
  '/animes/movie'
];

async function generateSitemap() {
  console.log('🗺️  Starting Sitemap Generation...');

  try {
    // 1. Fetch Dynamic Data from API
    console.log(`📡 Fetching data from ${API_URL}...`);
    const response = await fetch(API_URL);
    const json = await response.json();
    
    // The API returns data in { success: true, data: { ... } } format
    const data = json.data || {};
    
    // Use a Map to ensure unique Anime IDs
    const animeSet = new Map();

    const processAnimeList = (list) => {
      if (Array.isArray(list)) {
        list.forEach(anime => {
          if (anime.id) {
            animeSet.set(anime.id, anime);
          }
        });
      }
    };

    // Aggregate anime from all available sections on the home page
    processAnimeList(data.spotlight);
    processAnimeList(data.trending);
    processAnimeList(data.latestEpisode);
    processAnimeList(data.topUpcoming);
    processAnimeList(data.topAiring);
    if (data.top10) {
      processAnimeList(data.top10.today);
      processAnimeList(data.top10.week);
      processAnimeList(data.top10.month);
    }

    console.log(`✅ Found ${animeSet.size} unique anime pages.`);

    // 2. Build XML Content
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add Static Routes
    STATIC_ROUTES.forEach(route => {
      sitemap += `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add Dynamic Anime Routes
    for (const [id] of animeSet) {
      sitemap += `
  <url>
    <loc>${BASE_URL}/anime/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    sitemap += `
</urlset>`;

    // 3. Write to public/sitemap.xml
    const publicDir = path.resolve(__dirname, '../public');
    
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    const filePath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(filePath, sitemap);

    console.log(`🎉 Sitemap successfully generated at: ${filePath}`);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

generateSitemap();