import fs from 'fs-extra';
import path from 'path';
import zlib from 'zlib';

export class FileManager {
  private baseArchivePath: string;

  constructor() {
    this.baseArchivePath = process.env.ARCHIVE_BASE_PATH || './archives';
  }

  generateArchivePath(domain: string, timestamp: Date): string {
    const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = timestamp.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
    const timestampStr = `${dateStr}-${timeStr}`;
    
    return path.join(this.baseArchivePath, domain, timestampStr);
  }

  async createDirectory(dirPath: string): Promise<void> {
    await fs.ensureDir(dirPath);
  }

  async writeFile(filePath: string, content: string | Buffer): Promise<void> {
    await fs.ensureDir(path.dirname(filePath));
    
    // Compress text files (HTML, CSS, JS) but not images
    if (this.shouldCompress(filePath)) {
      const compressed = await this.compressContent(content);
      await fs.writeFile(filePath + '.gz', compressed);
    } else {
      await fs.writeFile(filePath, content);
    }
  }

  async readFile(filePath: string): Promise<Buffer> {
    // Try compressed version first
    const compressedPath = filePath + '.gz';
    if (await this.fileExists(compressedPath)) {
      const compressed = await fs.readFile(compressedPath);
      return await this.decompressContent(compressed);
    }
    
    // Fallback to uncompressed
    return await fs.readFile(filePath);
  }

  private shouldCompress(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    // Compress text files, not images or already compressed files
    return ['.html', '.css', '.js', '.json', '.xml', '.svg', '.txt'].includes(ext);
  }

  private async compressContent(content: string | Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.gzip(content, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  private async decompressContent(compressed: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressed, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255); // Limit filename length
  }

  getRelativePath(fullPath: string, basePath: string): string {
    return path.relative(basePath, fullPath);
  }

  joinPaths(...paths: string[]): string {
    return path.join(...paths);
  }
} 