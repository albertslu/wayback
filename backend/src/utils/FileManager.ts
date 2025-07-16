import fs from 'fs-extra';
import path from 'path';

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
    await fs.writeFile(filePath, content);
  }

  async readFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
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