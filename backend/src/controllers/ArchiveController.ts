import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { ArchiveService } from '../services/ArchiveService';
import { createError } from '../middleware/errorHandler';

export class ArchiveController {
  private archiveService: ArchiveService;

  constructor() {
    this.archiveService = new ArchiveService();
  }

  listArchives = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const archives = await prisma.archive.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { pages: true }
          }
        }
      });

      res.json({
        success: true,
        data: archives
      });
    } catch (error) {
      next(error);
    }
  };

  createArchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url } = req.body;

      if (!url) {
        throw createError('URL is required', 400);
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        throw createError('Invalid URL format', 400);
      }

      const archive = await this.archiveService.createArchive(url);

      res.status(201).json({
        success: true,
        data: archive
      });
    } catch (error) {
      next(error);
    }
  };

  getArchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const archive = await prisma.archive.findUnique({
        where: { id },
        include: {
          pages: {
            include: {
              _count: {
                select: { assets: true }
              }
            }
          }
        }
      });

      if (!archive) {
        throw createError('Archive not found', 404);
      }

      res.json({
        success: true,
        data: archive
      });
    } catch (error) {
      next(error);
    }
  };

  getArchivePages = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const pages = await prisma.page.findMany({
        where: { archiveId: id },
        include: {
          _count: {
            select: { assets: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      res.json({
        success: true,
        data: pages
      });
    } catch (error) {
      next(error);
    }
  };

  serveArchivedContent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const filePath = req.params[0]; // Captures the wildcard path

      let content: Buffer | string = await this.archiveService.serveArchivedFile(id, filePath);

      // Set appropriate content type based on file extension
      const ext = filePath.split('.').pop()?.toLowerCase();
      const contentTypes: { [key: string]: string } = {
        html: 'text/html',
        css: 'text/css',
        js: 'application/javascript',
        json: 'application/json',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        ico: 'image/x-icon'
      };

      // For HTML files, rewrite internal links to include the archive server path
      if (ext === 'html') {
        const htmlContent = content.toString('utf-8');
        content = await this.archiveService.rewriteLinksForServing(htmlContent, id);
      }

      // Set headers to allow iframe embedding
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      const port = process.env.PORT || '3001';
      res.setHeader('Content-Security-Policy', `frame-ancestors 'self' http://localhost:5173 http://localhost:${port}`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (ext && contentTypes[ext]) {
        res.setHeader('Content-Type', contentTypes[ext]);
      }

      res.send(content);
    } catch (error) {
      next(error);
    }
  };
} 