import { PrismaClient } from '@prisma/client';
import { WebCrawler } from './WebCrawler';
import { FileManager } from '../utils/FileManager';
import { createError } from '../middleware/errorHandler';
import path from 'path';

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
} 