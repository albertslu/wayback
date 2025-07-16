import puppeteer, { Browser, Page } from 'puppeteer';
import cheerio from 'cheerio';
import axios from 'axios';
import { URL } from 'url';
import { FileManager } from '../utils/FileManager';
import path from 'path';

interface CrawlResult {
  pages: PageData[];
  totalAssets: number;
}

interface PageData {
  url: string;
  title: string;
  filePath: string;
  linksCount: number;
  assets: AssetData[];
}

interface AssetData {
  type: 'IMAGE' | 'STYLESHEET' | 'SCRIPT' | 'FONT' | 'OTHER';
  originalUrl: string;
  localPath: string;
  size: number;
  mimeType: string;
}

export class WebCrawler {
  private fileManager: FileManager;
  private browser: Browser | null = null;
  private maxPages: number;
  private maxConcurrentRequests: number;
  private requestTimeout: number;

  constructor() {
    this.fileManager = new FileManager();
    this.maxPages = parseInt(process.env.MAX_PAGES_PER_DOMAIN || '100');
    this.maxConcurrentRequests = parseInt(process.env.MAX_CONCURRENT_REQUESTS || '5');
    this.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT || '30000');
  }

  async crawlSite(rootUrl: string, archivePath: string): Promise<CrawlResult> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const baseUrl = new URL(rootUrl);
      const crawledUrls = new Set<string>();
      const urlsToVisit = [rootUrl];
      const pages: PageData[] = [];
      let totalAssets = 0;

      while (urlsToVisit.length > 0 && pages.length < this.maxPages) {
        const currentUrl = urlsToVisit.shift()!;
        
        if (crawledUrls.has(currentUrl)) {
          continue;
        }

        crawledUrls.add(currentUrl);
        console.log(`🔍 Crawling: ${currentUrl}`);

        try {
          const pageData = await this.crawlPage(currentUrl, baseUrl, archivePath);
          pages.push(pageData);
          totalAssets += pageData.assets.length;

          // Extract links for further crawling
          const newUrls = await this.extractLinks(currentUrl, baseUrl);
          for (const url of newUrls) {
            if (!crawledUrls.has(url) && !urlsToVisit.includes(url)) {
              urlsToVisit.push(url);
            }
          }
        } catch (error) {
          console.error(`❌ Error crawling ${currentUrl}:`, error);
        }
      }

      return { pages, totalAssets };
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async crawlPage(url: string, baseUrl: URL, archivePath: string): Promise<PageData> {
    const page = await this.browser!.newPage();
    
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: this.requestTimeout 
      });

      const content = await page.content();
      const title = await page.title();
      
      // Parse HTML with Cheerio
      const $ = cheerio.load(content);
      
      // Process and download assets
      const assets: AssetData[] = [];
      
      // Process images
      $('img').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          const assetUrl = this.resolveUrl(src, url);
          if (assetUrl) {
            assets.push({
              type: 'IMAGE',
              originalUrl: assetUrl,
              localPath: '',
              size: 0,
              mimeType: 'image/*'
            });
          }
        }
      });

      // Process stylesheets
      $('link[rel="stylesheet"]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const assetUrl = this.resolveUrl(href, url);
          if (assetUrl) {
            assets.push({
              type: 'STYLESHEET',
              originalUrl: assetUrl,
              localPath: '',
              size: 0,
              mimeType: 'text/css'
            });
          }
        }
      });

      // Process scripts
      $('script[src]').each((_, element) => {
        const src = $(element).attr('src');
        if (src) {
          const assetUrl = this.resolveUrl(src, url);
          if (assetUrl) {
            assets.push({
              type: 'SCRIPT',
              originalUrl: assetUrl,
              localPath: '',
              size: 0,
              mimeType: 'application/javascript'
            });
          }
        }
      });

      // Download assets and update HTML
      const downloadedAssets = await this.downloadAssets(assets, archivePath);
      const modifiedHtml = this.updateHtmlWithLocalPaths($, downloadedAssets);

      // Save the modified HTML
      const filename = this.generateFilename(url);
      const filePath = path.join(archivePath, 'pages', filename);
      await this.fileManager.writeFile(filePath, modifiedHtml);

      return {
        url,
        title,
        filePath: this.fileManager.getRelativePath(filePath, archivePath),
        linksCount: $('a').length,
        assets: downloadedAssets
      };
    } finally {
      await page.close();
    }
  }

  private async extractLinks(url: string, baseUrl: URL): Promise<string[]> {
    try {
      const response = await axios.get(url, { timeout: this.requestTimeout });
      const $ = cheerio.load(response.data);
      const links: string[] = [];

      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          const resolvedUrl = this.resolveUrl(href, url);
          if (resolvedUrl && this.isSameDomain(resolvedUrl, baseUrl)) {
            links.push(resolvedUrl);
          }
        }
      });

      return [...new Set(links)]; // Remove duplicates
    } catch (error) {
      console.error(`❌ Error extracting links from ${url}:`, error);
      return [];
    }
  }

  private async downloadAssets(assets: AssetData[], archivePath: string): Promise<AssetData[]> {
    const downloadedAssets: AssetData[] = [];
    
    for (const asset of assets) {
      try {
        const response = await axios.get(asset.originalUrl, {
          responseType: 'arraybuffer',
          timeout: this.requestTimeout
        });

        const filename = this.generateAssetFilename(asset.originalUrl, asset.type);
        const localPath = path.join('assets', asset.type.toLowerCase(), filename);
        const fullPath = path.join(archivePath, localPath);

        await this.fileManager.writeFile(fullPath, response.data);

        downloadedAssets.push({
          ...asset,
          localPath,
          size: response.data.length,
          mimeType: response.headers['content-type'] || asset.mimeType
        });
      } catch (error) {
        console.error(`❌ Error downloading asset ${asset.originalUrl}:`, error);
      }
    }

    return downloadedAssets;
  }

  private updateHtmlWithLocalPaths($: cheerio.CheerioAPI, assets: AssetData[]): string {
    const assetMap = new Map(assets.map(asset => [asset.originalUrl, asset.localPath]));

    // Update image sources
    $('img').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        const resolvedUrl = this.resolveUrl(src, '');
        if (resolvedUrl && assetMap.has(resolvedUrl)) {
          $(element).attr('src', assetMap.get(resolvedUrl)!);
        }
      }
    });

    // Update stylesheet links
    $('link[rel="stylesheet"]').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const resolvedUrl = this.resolveUrl(href, '');
        if (resolvedUrl && assetMap.has(resolvedUrl)) {
          $(element).attr('href', assetMap.get(resolvedUrl)!);
        }
      }
    });

    // Update script sources
    $('script[src]').each((_, element) => {
      const src = $(element).attr('src');
      if (src) {
        const resolvedUrl = this.resolveUrl(src, '');
        if (resolvedUrl && assetMap.has(resolvedUrl)) {
          $(element).attr('src', assetMap.get(resolvedUrl)!);
        }
      }
    });

    return $.html();
  }

  private resolveUrl(url: string, baseUrl: string): string | null {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return null;
    }
  }

  private isSameDomain(url: string, baseUrl: URL): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === baseUrl.hostname;
    } catch {
      return false;
    }
  }

  private generateFilename(url: string): string {
    const urlObj = new URL(url);
    let filename = urlObj.pathname.replace(/\//g, '_');
    
    if (filename === '_' || filename === '') {
      filename = 'index';
    }
    
    if (!filename.endsWith('.html')) {
      filename += '.html';
    }
    
    return this.fileManager.sanitizeFilename(filename);
  }

  private generateAssetFilename(url: string, type: string): string {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    let filename = path.basename(pathname);
    
    if (!filename || filename === '/') {
      filename = `asset_${Date.now()}`;
    }
    
    return this.fileManager.sanitizeFilename(filename);
  }
} 