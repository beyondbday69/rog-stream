import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const API_URL = 'https://animesalt-api-lovat.vercel.app/api/home'; 
const BASE_URL = 'https://rog-stream.vercel.app';

// Static Routes to always include
const STATIC_ROUTES = [
  '/',
  '/regional',
  '/trending',
  '/genres',
  '/schedule',
  '/history',
  '/profile',
  '/login',
  '/benefits',
  '/documentation',
  '/api-docs',
  '/animes/trending',
  '/animes/top-airing',
  '/animes/most-popular',
  '/animes/movie'
];

async function generateSitemap() {
  console.log('🗺️  Starting Sitemap Generation...');

  try {
    // 1. Fetch Dynamic Data from AnimeSalt API
    console.log(`📡 Fetching data from ${API_URL}...`);
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const json = await response.json();
    const data = json.data || {};
    
    // Use a Set to ensure unique Slugs/IDs
    const animeIds = new Set();

    const processList = (list) => {
      if (Array.isArray(list)) {
        list.forEach(item => {
          const id = item.slug || item.id || item.animeId;
          if (id) animeIds.add(id);
        });
      }
    };

    // Extract from all home page sections
    Object.values(data).forEach(section => {
      if (Array.isArray(section)) {
        processList(section);
      } else if (typeof section === 'object' && section !== null) {
        Object.values(section).forEach(subList => processList(subList));
      }
    });

    console.log(`✅ Found ${animeIds.size} unique anime pages.`);

    // 2. Build XML Content
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add Static Routes
    STATIC_ROUTES.forEach(route => {
      sitemap += `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Add Dynamic Anime Routes
    animeIds.forEach(id => {
      // Add regular anime details route
      sitemap += `
  <url>
    <loc>${BASE_URL}/anime/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      
      // Add regional anime details route
      sitemap += `
  <url>
    <loc>${BASE_URL}/regional/anime/${id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    // 3. Write to public/sitemap.xml
    const publicDir = path.resolve(__dirname, '../public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);

    const filePath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(filePath, sitemap);

    console.log(`🎉 Sitemap successfully generated at: ${filePath}`);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error.message);
    // Continue even if API fails to at least have static routes
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    STATIC_ROUTES.forEach(route => {
      sitemap += `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
    });
    sitemap += `
</urlset>`;
    const filePath = path.join(path.resolve(__dirname, '../public'), 'sitemap.xml');
    fs.writeFileSync(filePath, sitemap);
  }
}

generateSitemap();