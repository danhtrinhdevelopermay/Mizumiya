import { Router } from 'express';
import { TikTokScraper } from '../services/tiktok-scraper.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Get TikTok videos by search
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { 
      q: query = 'viral', 
      type: searchType = 'keyword',
      limit = '10' 
    } = req.query;

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
    res.status(500).json({ 
      error: 'Failed to fetch TikTok videos',
      message: error instanceof Error ? error.message : 'Unknown error'
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
    res.status(500).json({ 
      error: 'Failed to fetch trending TikTok videos',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get videos by hashtag
router.get('/hashtag/:tag', requireAuth, async (req, res) => {
  try {
    const { tag } = req.params;
    const { limit = '10' } = req.query;
    
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
    res.status(500).json({ 
      error: 'Failed to fetch TikTok hashtag videos',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;