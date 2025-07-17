import { PrismaClient } from '@prisma/client';
import { WebCrawler } from './WebCrawler';
import { FileManager } from '../utils/FileManager';
import { createError } from '../middleware/errorHandler';
import path from 'path';
import * as cheerio from 'cheerio';

export class ArchiveService {
  private prisma: PrismaClient;
  private webCrawler: WebCrawler;
  private fileManager: FileManager;

  constructor() {
    this.prisma = new PrismaClient();
    this.webCrawler = new WebCrawler();
    this.fileManager = new FileManager();
  }

  async createArchive(url: string) {
    try {
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;
      const timestamp = new Date();
      
      // Create archive directory path
      const archivePath = this.fileManager.generateArchivePath(domain, timestamp);
      
      // Create archive record in database
      const archive = await this.prisma.archive.create({
        data: {
          domain,
          rootUrl: url,
          timestamp,
          filePath: archivePath,
          status: 'IN_PROGRESS'
        }
      });

      // Start crawling process (async)
      this.startCrawling(archive.id, url, archivePath).catch(error => {
        console.error(`❌ Crawling failed for archive ${archive.id}:`, error);
        this.updateArchiveStatus(archive.id, 'FAILED');
      });

      return archive;
    } catch (error) {
      throw createError('Failed to create archive', 500);
    }
  }

  private async startCrawling(archiveId: string, rootUrl: string, archivePath: string) {
    try {
      console.log(`🕷️ Starting crawl for: ${rootUrl}`);
      
      // Create archive directory
      await this.fileManager.createDirectory(archivePath);
      
      // Start crawling
      const crawlResult = await this.webCrawler.crawlSite(rootUrl, archivePath);
      
      // Update database with crawl results
      await this.updateArchiveWithResults(archiveId, crawlResult);
      
      // Update archive status
      await this.updateArchiveStatus(archiveId, 'COMPLETED');
      
      console.log(`✅ Crawl completed for archive: ${archiveId}`);
    } catch (error) {
      console.error(`❌ Crawling error for archive ${archiveId}:`, error);
      await this.updateArchiveStatus(archiveId, 'FAILED');
      throw error;
    }
  }

  private async updateArchiveWithResults(archiveId: string, crawlResult: any) {
    // Update archive with totals
    await this.prisma.archive.update({
      where: { id: archiveId },
      data: {
        totalPages: crawlResult.pages.length,
        totalAssets: crawlResult.totalAssets
      }
    });

    // Create page records
    for (const pageData of crawlResult.pages) {
      const page = await this.prisma.page.create({
        data: {
          archiveId,
          url: pageData.url,
          title: pageData.title,
          filePath: pageData.filePath,
          linksCount: pageData.linksCount,
          status: 'COMPLETED'
        }
      });

      // Create asset records
      for (const assetData of pageData.assets) {
        await this.prisma.asset.create({
          data: {
            pageId: page.id,
            type: assetData.type,
            originalUrl: assetData.originalUrl,
            localPath: assetData.localPath,
            size: assetData.size,
            compressedSize: assetData.compressedSize,
            isCompressed: assetData.isCompressed || false,
            mimeType: assetData.mimeType,
            status: 'DOWNLOADED'
          }
        });
      }
    }
  }

  private async updateArchiveStatus(archiveId: string, status: 'COMPLETED' | 'FAILED') {
    await this.prisma.archive.update({
      where: { id: archiveId },
      data: { status }
    });
  }

  async serveArchivedFile(archiveId: string, filePath: string) {
    try {
      const archive = await this.prisma.archive.findUnique({
        where: { id: archiveId }
      });

      if (!archive) {
        throw createError('Archive not found', 404);
      }

      const fullPath = path.join(archive.filePath, filePath);
      return await this.fileManager.readFile(fullPath);
    } catch (error) {
      throw createError('File not found', 404);
    }
  }

  async rewriteLinksForServing(htmlContent: string, archiveId: string): Promise<string> {
    const $ = cheerio.load(htmlContent);

    // Get the base URL for the archive server with full domain
    const port = process.env.PORT || '3001';
    const baseArchiveUrl = `http://localhost:${port}/api/archives/${archiveId}/serve`;

    // Get all archived pages for this archive to check which links should be rewritten
    const pages = await this.prisma.page.findMany({
      where: { archiveId },
      select: { url: true, filePath: true }
    });

    // Create mappings for URL to file path lookups
    const originalUrlToFilePath = new Map<string, string>();
    const pathToFilePath = new Map<string, string>();
    
    for (const page of pages) {
      const url = new URL(page.url);
      originalUrlToFilePath.set(page.url, page.filePath);
      // Map both the pathname and pathname without leading slash
      pathToFilePath.set(url.pathname, page.filePath);
      if (url.pathname.startsWith('/')) {
        pathToFilePath.set(url.pathname.substring(1), page.filePath);
      }
    }

    // Update all internal links to include the archive server path
    $('a[href]').each((_: number, element: any) => {
      const href = $(element).attr('href');
      if (href) {
        let targetFilePath: string | undefined;
        
        // Check if it's a relative path that maps to an archived page
        if (href.startsWith('pages/') || href.endsWith('.html')) {
          targetFilePath = href;
        }
        // Check if it's an absolute path starting with / that maps to an archived page
        else if (href.startsWith('/') && pathToFilePath.has(href)) {
          targetFilePath = pathToFilePath.get(href);
        }
        // Check if it's a relative path without leading slash
        else if (!href.startsWith('http') && pathToFilePath.has('/' + href)) {
          targetFilePath = pathToFilePath.get('/' + href);
        }
        // Check if it's a path without leading slash that maps directly
        else if (!href.startsWith('http') && pathToFilePath.has(href)) {
          targetFilePath = pathToFilePath.get(href);
        }

        // If we found a matching archived page, rewrite the link
        if (targetFilePath) {
          const newHref = `${baseArchiveUrl}/${targetFilePath}`;
          $(element).attr('href', newHref);
        }
      }
    });

    // Also update relative asset paths to point to the archive server
    $('img[src]').each((_: number, element: any) => {
      const src = $(element).attr('src');
      if (src && src.startsWith('assets/')) {
        $(element).attr('src', `${baseArchiveUrl}/${src}`);
      }
    });

    $('link[href]').each((_: number, element: any) => {
      const href = $(element).attr('href');
      if (href && href.startsWith('assets/')) {
        $(element).attr('href', `${baseArchiveUrl}/${href}`);
      }
    });

    $('script[src]').each((_: number, element: any) => {
      const src = $(element).attr('src');
      if (src && src.startsWith('assets/')) {
        $(element).attr('src', `${baseArchiveUrl}/${src}`);
      }
    });

    return $.html();
  }
} 