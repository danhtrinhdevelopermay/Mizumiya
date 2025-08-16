import { Router } from 'express';
import { TikTokScraper } from '../services/tiktok-scraper.js';
import { tiktokImportService } from '../services/tiktok-import.js';
import { storage } from '../storage.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Get TikTok videos by search
router.get('/search', requireAuth, async (req, res) => {
  const { 
    q: query = 'viral', 
    type: searchType = 'keyword',
    limit = '10' 
  } = req.query;

  try {
    console.log(`🎬 TikTok API: Fetching videos for "${query}" (${searchType})`);

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query parameter is required and must be a string' 
      });
    }

    if (searchType !== 'keyword' && searchType !== 'hashtag') {
      return res.status(400).json({ 
        error: 'Type must be either "keyword" or "hashtag"' 
      });
    }

    const maxVideos = Math.min(parseInt(limit as string) || 10, 50); // Limit to max 50 videos
    
    const scraper = TikTokScraper.getInstance();
    const videos = await scraper.scrapeVideos(
      searchType as 'keyword' | 'hashtag',
      query,
      maxVideos
    );

    // Add some random processing delay to make it feel more realistic
    await new Promise(resolve => setTimeout(resolve, 1000));

    res.json({
      success: true,
      query,
      searchType,
      count: videos.length,
      videos
    });

  } catch (error) {
    console.error('❌ TikTok API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isScrapingError = errorMessage.includes('Failed to scrape real TikTok videos');
    
    res.status(503).json({ 
      error: 'TikTok scraping service temporarily unavailable',
      message: isScrapingError ? 
        `Unable to fetch real TikTok videos for "${query}". The scraping service is having issues connecting to TikTok.` :
        'TikTok service is temporarily unavailable. Please try again later.',
      query,
      searchType,
      suggestion: 'Please try again with a different search term or try again later.'
    });
  }
});

// Get trending TikTok videos
router.get('/trending', requireAuth, async (req, res) => {
  try {
    const { limit = '15' } = req.query;
    const maxVideos = Math.min(parseInt(limit as string) || 15, 50);

    console.log(`🔥 TikTok API: Fetching ${maxVideos} trending videos`);

    const scraper = TikTokScraper.getInstance();
    
    // Mix different trending topics for variety
    const trendingQueries = ['viral', 'fyp', 'trending', 'funny', 'dance'];
    const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
    
    const videos = await scraper.scrapeVideos('keyword', randomQuery, maxVideos);

    res.json({
      success: true,
      query: 'trending',
      count: videos.length,
      videos
    });

  } catch (error) {
    console.error('❌ TikTok trending API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isScrapingError = errorMessage.includes('Failed to scrape real TikTok videos');
    
    res.status(503).json({ 
      error: 'TikTok scraping service temporarily unavailable',
      message: isScrapingError ? 
        'Unable to fetch real trending TikTok videos. The scraping service is having issues connecting to TikTok.' :
        'TikTok trending service is temporarily unavailable. Please try again later.',
      suggestion: 'Please try again later or check your internet connection.'
    });
  }
});

// Get videos by hashtag
router.get('/hashtag/:tag', requireAuth, async (req, res) => {
  const { tag } = req.params;
  const { limit = '10' } = req.query;
  
  try {
    if (!tag) {
      return res.status(400).json({ error: 'Hashtag parameter is required' });
    }

    const maxVideos = Math.min(parseInt(limit as string) || 10, 50);
    
    console.log(`#️⃣ TikTok API: Fetching videos for hashtag #${tag}`);

    const scraper = TikTokScraper.getInstance();
    const videos = await scraper.scrapeVideos('hashtag', tag, maxVideos);

    res.json({
      success: true,
      hashtag: tag,
      count: videos.length,
      videos
    });

  } catch (error) {
    console.error('❌ TikTok hashtag API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isScrapingError = errorMessage.includes('Failed to scrape real TikTok videos');
    
    res.status(503).json({ 
      error: 'TikTok scraping service temporarily unavailable',
      message: isScrapingError ? 
        `Unable to fetch real TikTok videos for hashtag "#${tag}". The scraping service is having issues connecting to TikTok.` :
        'TikTok hashtag service is temporarily unavailable. Please try again later.',
      hashtag: tag,
      suggestion: 'Please try again with a different hashtag or try again later.'
    });
  }
});

// Admin TikTok Import Routes
router.post('/admin/import', requireAuth, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'TikTok URL is required'
      });
    }
    
    console.log(`🎬 Admin importing TikTok video: ${url}`);
    
    const result = await tiktokImportService.importVideoFromUrl(url);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ TikTok import error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      success: false,
      message: 'Failed to import TikTok video',
      error: errorMessage
    });
  }
});

// Get import history
router.get('/admin/imports', requireAuth, async (req, res) => {
  try {
    const { limit = '50' } = req.query;
    const maxLimit = Math.min(parseInt(limit as string) || 50, 100);
    
    const imports = await storage.getTiktokImports(maxLimit);
    
    res.json({
      success: true,
      imports
    });
    
  } catch (error) {
    console.error('❌ Error fetching TikTok imports:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch import history',
      error: errorMessage
    });
  }
});

// Get TikTok accounts
router.get('/admin/accounts', requireAuth, async (req, res) => {
  try {
    // This would need a new storage method to get all TikTok accounts
    // For now, return empty array
    res.json({
      success: true,
      accounts: []
    });
    
  } catch (error) {
    console.error('❌ Error fetching TikTok accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch TikTok accounts',
      error: errorMessage
    });
  }
});

export default router;