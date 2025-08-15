import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

export interface TikTokVideo {
  id: string;
  videoUrl: string;
  webmUrl?: string;
  thumbnail: string;
  caption: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  music: {
    title: string;
    artist: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  createdTime: number;
}

export class TikTokScraper {
  private static instance: TikTokScraper;
  private browser: any = null;

  private constructor() {}

  public static getInstance(): TikTokScraper {
    if (!TikTokScraper.instance) {
      TikTokScraper.instance = new TikTokScraper();
    }
    return TikTokScraper.instance;
  }

  private async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-extensions',
          '--no-first-run',
          '--disable-default-apps',
        ],
      });
    }
    return this.browser;
  }

  public async scrapeVideos(
    searchType: 'keyword' | 'hashtag' = 'keyword',
    query: string = 'viral',
    maxVideos: number = 10
  ): Promise<TikTokVideo[]> {
    let page;
    
    try {
      console.log(`🎬 Scraping TikTok videos for: ${query} (${searchType})`);
      
      const browser = await this.initBrowser();
      page = await browser.newPage();

      // Enhanced user agent and headers to avoid detection
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
      );

      // Set additional headers
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      });

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Generate TikTok URL
      const url = searchType === 'keyword' 
        ? `https://www.tiktok.com/search?q=${encodeURIComponent(query)}`
        : `https://www.tiktok.com/tag/${encodeURIComponent(query)}`;

      console.log(`🔗 Navigating to: ${url}`);
      
      // Navigate to TikTok with longer timeout
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 
      });

      // Wait a bit for dynamic content
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try multiple selectors for videos
      const selectors = [
        '[data-e2e="search-card-video"]',
        '[data-testid="video-card"]',
        'div[data-e2e="search-card"]',
        'div[class*="DivItemContainer"]',
        'div[class*="video-card"]',
        'a[href*="/video/"]'
      ];

      let foundVideos = false;
      let selectedSelector = '';
      
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          const count = await page.$$eval(selector, (els: Element[]) => els.length);
          if (count > 0) {
            console.log(`✅ Found ${count} videos with selector: ${selector}`);
            selectedSelector = selector;
            foundVideos = true;
            break;
          }
        } catch (e) {
          console.log(`❌ Selector ${selector} not found`);
        }
      }

      if (!foundVideos) {
        throw new Error('No video elements found with any selector');
      }

      // Scroll to load more videos
      console.log('📜 Scrolling to load more videos...');
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`   Scroll ${i + 1}/3 completed`);
      }

      // Extract video data with improved selectors
      console.log('🎯 Extracting video data...');
      const videos = await page.evaluate((maxVideos: number, selector: string) => {
        const videoElements = document.querySelectorAll(selector);
        const videos: any[] = [];
        
        for (let i = 0; i < Math.min(videoElements.length, maxVideos); i++) {
          const element = videoElements[i];
          
          try {
            // Try multiple ways to get video link
            let videoLink = '';
            let linkElement = element.querySelector('a');
            if (!linkElement) {
              linkElement = element.closest('a') || (element.parentElement ? element.parentElement.querySelector('a') : null);
            }
            videoLink = linkElement?.href || '';
            
            if (!videoLink || !videoLink.includes('/video/')) {
              continue; // Skip if no valid video link
            }
            
            // Extract video ID from URL
            const videoId = videoLink.split('/video/')[1]?.split('?')[0] || `video_${Date.now()}_${i}`;
            
            // Try multiple ways to get thumbnail
            let thumbnail = '';
            const imgElements = element.querySelectorAll('img');
            for (const img of imgElements) {
              if (img.src && (img.src.includes('tiktok') || img.src.includes('p16-sign'))) {
                thumbnail = img.src;
                break;
              }
            }
            
            // Try multiple ways to get username
            let username = 'unknown';
            const userSelectors = [
              '[data-e2e="search-card-user-unique-id"]',
              '[data-testid="user-unique-id"]',
              'p[data-e2e="search-card-user-unique-id"]',
              'a[href*="/@"]',
              'span[class*="username"]'
            ];
            
            for (const userSelector of userSelectors) {
              const userElement = element.querySelector(userSelector);
              if (userElement?.textContent) {
                username = userElement.textContent.replace('@', '').trim();
                break;
              }
            }
            
            // Try multiple ways to get caption
            let caption = 'No caption';
            const captionSelectors = [
              '[data-e2e="search-card-desc"]',
              '[data-testid="video-desc"]',
              'div[class*="caption"]',
              'div[class*="description"]'
            ];
            
            for (const captionSelector of captionSelectors) {
              const captionElement = element.querySelector(captionSelector);
              if (captionElement?.textContent) {
                caption = captionElement.textContent.trim();
                break;
              }
            }
            
            // Try to get view count
            let views = 0;
            const statsSelectors = [
              '[data-e2e="video-views"]',
              '[data-testid="video-views"]',
              'strong[data-e2e="video-views"]',
              'div[class*="views"]'
            ];
            
            for (const statsSelector of statsSelectors) {
              const statsElement = element.querySelector(statsSelector);
              if (statsElement?.textContent) {
                const viewText = statsElement.textContent;
                if (viewText.includes('K')) {
                  views = parseFloat(viewText.replace('K', '')) * 1000;
                } else if (viewText.includes('M')) {
                  views = parseFloat(viewText.replace('M', '')) * 1000000;
                } else if (viewText.includes('B')) {
                  views = parseFloat(viewText.replace('B', '')) * 1000000000;
                } else {
                  views = parseInt(viewText.replace(/\D/g, '')) || 0;
                }
                break;
              }
            }
            
            const video = {
              id: videoId,
              videoUrl: videoLink,
              thumbnail: thumbnail,
              caption: caption,
              user: {
                id: username,
                username: username,
                displayName: username,
                avatar: thumbnail ? `https://p16-sign-sg.tiktokcdn.com/aweme/100x100/${username}.jpeg` : '',
                isVerified: false // We can't reliably detect this from scraping
              },
              music: {
                title: 'Original Sound',
                artist: username
              },
              stats: {
                likes: 0, // We can't reliably get these from search results
                comments: 0,
                shares: 0,
                views: views
              },
              createdTime: Date.now()
            };
            
            videos.push(video);
          } catch (error) {
            console.error('Error processing video element:', error);
          }
        }
        
        return videos;
      }, maxVideos, selectedSelector);

      console.log(`✅ Successfully scraped ${videos.length} real TikTok videos`);
      
      await page.close();
      
      // Only return videos if we have real data
      if (videos.length === 0) {
        throw new Error('No real TikTok videos found');
      }
      
      return videos;

    } catch (error) {
      console.error('❌ TikTok scraping error:', error);
      
      if (page) {
        await page.close();
      }
      
      // NO MORE FAKE FALLBACK - throw error instead
      throw new Error(`Failed to scrape real TikTok videos for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


  public async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export default TikTokScraper;