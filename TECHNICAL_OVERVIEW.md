# Wayback Archive - Technical Overview

## Project Overview

A personal web archiving system that captures complete snapshots of websites, preserving them for offline browsing even when original sites become unavailable. This is essentially a private Wayback Machine built with modern web technologies.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Backend │    │   PostgreSQL    │
│                 │◄──►│                 │◄──►│    Database     │
│  - User Interface│    │  - API Endpoints│    │  - Metadata     │
│  - Archive Browser│   │  - Web Crawler  │    │  - Relationships│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  File System    │
                       │  - HTML Files   │
                       │  - Assets       │
                       │  - Screenshots  │
                       └─────────────────┘
```

## Overall System Flow

### 1. **User Interaction Flow**
```
User enters URL → Frontend validates → API call to backend → Archive created
       ↓
Archive status tracking → Real-time updates → Completion notification
       ↓
Browse archived content → Serve static files → View preserved website
```

### 2. **Backend Processing Flow**

#### A. Archive Creation
```typescript
POST /api/archives
├── Validate URL format
├── Create database record (status: PENDING)
├── Start background crawling process
└── Return archive ID to frontend
```

#### B. Web Crawling Process
```typescript
WebCrawler.crawlSite()
├── Launch Puppeteer browser
├── Navigate to target URL
├── Extract page content and metadata
├── Discover linked pages and assets
├── Download and save all resources
├── Update HTML with local asset paths
├── Save to organized file structure
└── Update database with results
```

#### C. File Organization
```
archives/
├── {domain}/
│   └── {timestamp}/
│       ├── pages/
│       │   ├── index.html
│       │   └── about.html
│       └── assets/
│           ├── image/
│           ├── stylesheet/
│           ├── script/
│           └── font/
```

### 3. **Data Models**

#### Database Schema (Prisma)
```typescript
model Archive {
  id          String        @id @default(cuid())
  domain      String
  rootUrl     String
  status      ArchiveStatus @default(PENDING)
  totalPages  Int           @default(0)
  totalAssets Int           @default(0)
  filePath    String
  createdAt   DateTime      @default(now())
  pages       Page[]
}

model Page {
  id          String     @id @default(cuid())
  url         String
  title       String?
  filePath    String
  status      PageStatus @default(PENDING)
  linksCount  Int        @default(0)
  assets      Asset[]
}

model Asset {
  id          String      @id @default(cuid())
  type        AssetType
  originalUrl String
  localPath   String
  size        Int?
  mimeType    String?
}
```

### 4. **Technology Stack**

#### Frontend (React + TypeScript)
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Tailwind CSS** - Styling and responsive design
- **Lucide React** - Icon system
- **Vite** - Build tool and development server

#### Backend (Node.js + TypeScript)
- **Express.js** - Web server framework
- **Prisma** - Database ORM and schema management
- **Puppeteer** - Headless browser for web crawling
- **Cheerio** - Server-side HTML parsing
- **fs-extra** - Enhanced file system operations

#### Infrastructure
- **PostgreSQL** - Primary database
- **File System** - Static asset storage
- **Vercel** - Frontend deployment
- **Environment Variables** - Configuration management

---

## Technical Write-up

### Decisions and Trade-offs Made

#### 1. **Technology Choices**
- **TypeScript over JavaScript**: Chose TypeScript for both frontend and backend to provide type safety and better developer experience, despite the additional compilation step.
- **Prisma over Raw SQL**: Selected Prisma ORM for type-safe database operations and automatic migrations, trading some performance for developer productivity.
- **File System over Object Storage**: Stored archived content on local file system rather than cloud storage (S3, etc.) for simplicity and cost, limiting scalability but reducing complexity.

#### 2. **Architecture Decisions**
- **Separate Frontend/Backend**: Chose a decoupled architecture instead of a monolithic Next.js app to allow independent scaling and deployment.
- **Puppeteer over Simple HTTP**: Used Puppeteer for JavaScript rendering capabilities, trading performance for completeness of archived content.
- **Asynchronous Processing**: Implemented background crawling to prevent UI blocking, accepting the complexity of status tracking.

#### 3. **Data Storage Strategy**
- **Dual Storage Model**: Stored metadata in PostgreSQL and content files on disk, optimizing for both searchability and serving performance.
- **Organized File Structure**: Used domain/timestamp folder structure for human readability and conflict prevention.

### What I Would Do Differently with More Time

#### 1. **Enhanced Error Handling**
- Implement retry mechanisms for failed downloads
- Add circuit breakers for unreliable websites
- Graceful degradation when partial content fails

#### 2. **Performance Optimizations**

**Concurrent Crawling with Worker Pools:**
```typescript
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';

class ConcurrentCrawler {
  private workers: Worker[] = [];
  private maxWorkers = require('os').cpus().length;

  async crawlSiteParallel(urls: string[], archivePath: string): Promise<void> {
    const urlChunks = this.chunkArray(urls, this.maxWorkers);
    
    const promises = urlChunks.map((chunk, index) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { urls: chunk, archivePath, workerId: index }
        });
        
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
      });
    });

    await Promise.all(promises);
  }
}

// Worker thread code
if (!isMainThread) {
  const { urls, archivePath, workerId } = workerData;
  // Process URLs in this worker...
  parentPort?.postMessage({ workerId, completed: urls.length });
}
```

**Incremental Updates with Content Hashing:**
```typescript
import crypto from 'crypto';

class IncrementalArchiver {
  async checkForChanges(url: string, lastArchive: Archive): Promise<boolean> {
    const response = await axios.get(url);
    const currentHash = crypto.createHash('sha256')
      .update(response.data)
      .digest('hex');
    
    const lastPage = await this.prisma.page.findFirst({
      where: { archiveId: lastArchive.id, url },
      select: { contentHash: true }
    });

    return !lastPage || lastPage.contentHash !== currentHash;
  }

  async incrementalCrawl(domain: string): Promise<void> {
    const lastArchive = await this.getLastArchiveForDomain(domain);
    if (!lastArchive) return this.fullCrawl(domain);

    const urlsToUpdate: string[] = [];
    const existingUrls = await this.getAllUrlsFromArchive(lastArchive.id);

    for (const url of existingUrls) {
      if (await this.checkForChanges(url, lastArchive)) {
        urlsToUpdate.push(url);
      }
    }

    // Only crawl changed pages + discover new ones
    await this.crawlUrls(urlsToUpdate);
  }
}

// Update schema for content hashing
model Page {
  id          String   @id @default(cuid())
  contentHash String?  // SHA256 hash of content
  lastChecked DateTime @default(now())
}
```

**Content Deduplication System:**
```typescript
class AssetDeduplicationService {
  async deduplicateAsset(originalUrl: string, content: Buffer): Promise<string> {
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    
    // Check if we already have this asset
    const existingAsset = await this.prisma.sharedAsset.findUnique({
      where: { contentHash }
    });

    if (existingAsset) {
      // Return existing asset path
      return existingAsset.sharedPath;
    }

    // Store new shared asset
    const sharedPath = `shared-assets/${contentHash.substring(0, 2)}/${contentHash}`;
    await this.fileManager.writeFile(sharedPath, content);
    
    await this.prisma.sharedAsset.create({
      data: {
        contentHash,
        originalUrl,
        sharedPath,
        size: content.length,
        referenceCount: 1
      }
    });

    return sharedPath;
  }
}

// New schema for shared assets
model SharedAsset {
  id             String @id @default(cuid())
  contentHash    String @unique
  sharedPath     String
  originalUrl    String
  size           Int
  referenceCount Int    @default(0)
  createdAt      DateTime @default(now())
  
  @@map("shared_assets")
}
```

#### 3. **User Experience Improvements**

**Real-time Progress with WebSockets:**
```typescript
// WebSocket implementation for live updates
import { Server as SocketIOServer } from 'socket.io';

class ArchiveProgressService {
  private io: SocketIOServer;

  constructor(server: any) {
    this.io = new SocketIOServer(server, {
      cors: { origin: process.env.FRONTEND_URL }
    });
  }

  emitCrawlProgress(archiveId: string, progress: {
    currentUrl: string;
    pagesCompleted: number;
    totalPages: number;
    assetsDownloaded: number;
    errors: string[];
    estimatedTimeRemaining: number;
  }): void {
    this.io.to(`archive-${archiveId}`).emit('crawl-progress', progress);
  }

  subscribeToArchive(socket: any, archiveId: string): void {
    socket.join(`archive-${archiveId}`);
  }
}
```

**AI-Powered Preview Generation:**
```typescript
import sharp from 'sharp';
import { OpenAI } from 'openai';

class IntelligentPreviewService {
  private openai: OpenAI;

  async generateSmartThumbnail(htmlContent: string, url: string): Promise<Buffer> {
    // Take screenshot with Puppeteer
    const screenshot = await this.takeScreenshot(url);
    
    // Use AI to identify the most important content areas
    const importantRegions = await this.identifyKeyContent(htmlContent);
    
    // Crop and enhance the thumbnail focusing on key content
    return await sharp(screenshot)
      .extract({
        left: importantRegions.x,
        top: importantRegions.y,
        width: importantRegions.width,
        height: importantRegions.height
      })
      .resize(400, 300, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();
  }

  async generateContentSummary(htmlContent: string): Promise<string> {
    const textContent = this.extractTextContent(htmlContent);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Summarize this webpage content in 2-3 sentences, focusing on the main purpose and key information."
        },
        { role: "user", content: textContent.substring(0, 4000) }
      ],
      max_tokens: 150
    });

    return response.choices[0].message.content || "No summary available";
  }
}
```

**Advanced Full-Text Search with Elasticsearch:**
```typescript
import { Client } from '@elastic/elasticsearch';

class AdvancedSearchService {
  private client: Client;

  constructor() {
    this.client = new Client({ node: process.env.ELASTICSEARCH_URL });
  }

  async indexArchiveContent(archive: Archive, pages: Page[]): Promise<void> {
    const body = pages.flatMap(page => [
      { index: { _index: 'archived-pages', _id: page.id } },
      {
        archiveId: archive.id,
        domain: archive.domain,
        url: page.url,
        title: page.title,
        content: this.extractTextContent(page.htmlContent),
        timestamp: archive.timestamp,
        tags: this.extractTags(page.htmlContent),
        metadata: {
          linksCount: page.linksCount,
          hasImages: page.assets.some(a => a.type === 'IMAGE'),
          hasVideos: page.assets.some(a => a.type === 'VIDEO')
        }
      }
    ]);

    await this.client.bulk({ body });
  }

  async searchAcrossArchives(query: string, filters?: {
    domain?: string;
    dateRange?: { from: Date; to: Date };
    contentType?: string;
  }): Promise<SearchResult[]> {
    const searchQuery = {
      index: 'archived-pages',
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^3', 'content', 'url^2'],
                  type: 'best_fields'
                }
              }
            ],
            filter: this.buildFilters(filters)
          }
        },
        highlight: {
          fields: {
            content: { fragment_size: 150, number_of_fragments: 3 },
            title: {}
          }
        },
        size: 50
      }
    };

    return await this.client.search(searchQuery);
  }
}
```

**Visual Diff for Archive Comparisons:**
```typescript
import { diffWords, diffLines } from 'diff';
import pixelmatch from 'pixelmatch';

class ArchiveComparisonService {
  async compareArchiveVersions(oldArchiveId: string, newArchiveId: string, url: string): Promise<{
    textDiff: any;
    visualDiff: Buffer;
    structuralChanges: any;
  }> {
    const [oldPage, newPage] = await Promise.all([
      this.getPageContent(oldArchiveId, url),
      this.getPageContent(newArchiveId, url)
    ]);

    // Text content comparison
    const textDiff = diffLines(
      this.extractTextContent(oldPage.content),
      this.extractTextContent(newPage.content)
    );

    // Visual comparison
    const [oldScreenshot, newScreenshot] = await Promise.all([
      this.getScreenshot(oldArchiveId, url),
      this.getScreenshot(newArchiveId, url)
    ]);

    const visualDiff = await this.generateVisualDiff(oldScreenshot, newScreenshot);

    // Structural changes (DOM differences)
    const structuralChanges = await this.compareHtmlStructure(
      oldPage.content,
      newPage.content
    );

    return { textDiff, visualDiff, structuralChanges };
  }

  async generateVisualDiff(img1: Buffer, img2: Buffer): Promise<Buffer> {
    const { PNG } = require('pngjs');
    
    const png1 = PNG.sync.read(img1);
    const png2 = PNG.sync.read(img2);
    const diff = new PNG({ width: png1.width, height: png1.height });

    const numDiffPixels = pixelmatch(
      png1.data, png2.data, diff.data,
      png1.width, png1.height,
      { threshold: 0.1 }
    );

    return PNG.sync.write(diff);
  }
}
```

#### 4. **Advanced Content Fidelity**

**SPA and JavaScript-Heavy Site Handling:**
```typescript
class AdvancedCrawler {
  async crawlSPA(url: string): Promise<PageData> {
    const page = await this.browser.newPage();
    
    // Enable JavaScript execution
    await page.setJavaScriptEnabled(true);
    
    // Wait for network to be idle and content to load
    await page.goto(url, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000 
    });

    // Wait for common SPA frameworks to finish rendering
    await page.waitForFunction(() => {
      return window.document.readyState === 'complete' &&
             // React
             (!window.React || window.React.version) &&
             // Vue
             (!window.Vue || document.querySelector('[data-v-]')) &&
             // Angular
             (!window.ng || window.getAllAngularRootElements().length > 0);
    }, { timeout: 10000 });

    // Scroll to trigger lazy loading
    await this.autoScroll(page);
    
    // Capture state after interactions
    const content = await page.content();
    
    // Save JavaScript state and localStorage
    const browserState = await page.evaluate(() => ({
      localStorage: { ...localStorage },
      sessionStorage: { ...sessionStorage },
      cookies: document.cookie
    }));

    return {
      content,
      browserState,
      // ... other data
    };
  }

  async autoScroll(page: any): Promise<void> {
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve(null);
          }
        }, 100);
      });
    });
  }
}
```

**Media Content Preservation:**
```typescript
class MediaArchiver {
  async archiveVideo(videoUrl: string, archivePath: string): Promise<AssetData> {
    // Use youtube-dl or similar for video downloads
    const ytdl = require('youtube-dl-exec');
    
    const info = await ytdl(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true
    });

    // Download best quality video + audio
    const outputPath = path.join(archivePath, 'media', `${info.id}.mp4`);
    
    await ytdl(videoUrl, {
      format: 'best[height<=720]', // Limit quality for storage
      output: outputPath
    });

    // Generate thumbnail
    const thumbnailPath = await this.generateVideoThumbnail(outputPath);
    
    return {
      type: 'VIDEO',
      originalUrl: videoUrl,
      localPath: outputPath,
      thumbnailPath,
      metadata: {
        duration: info.duration,
        title: info.title,
        description: info.description,
        uploadDate: info.upload_date
      }
    };
  }

  async archiveAudio(audioUrl: string): Promise<AssetData> {
    // Similar implementation for audio files
    // Support for podcasts, music, etc.
  }
}
```

**Interactive Elements Preservation:**
```typescript
class InteractivityPreserver {
  async preserveFormState(page: any): Promise<any> {
    return await page.evaluate(() => {
      const forms = Array.from(document.forms);
      return forms.map(form => ({
        action: form.action,
        method: form.method,
        fields: Array.from(form.elements).map(element => ({
          name: element.name,
          type: element.type,
          value: element.value,
          options: element.options ? Array.from(element.options).map(opt => ({
            text: opt.text,
            value: opt.value,
            selected: opt.selected
          })) : null
        }))
      }));
    });
  }

  async captureInteractiveState(page: any): Promise<any> {
    return await page.evaluate(() => {
      // Capture expanded/collapsed states
      const collapsibleElements = document.querySelectorAll('[aria-expanded]');
      
      // Capture tab states
      const tabElements = document.querySelectorAll('[role="tab"]');
      
      // Capture modal states
      const modalElements = document.querySelectorAll('[role="dialog"]');
      
      return {
        collapsibleStates: Array.from(collapsibleElements).map(el => ({
          selector: this.generateSelector(el),
          expanded: el.getAttribute('aria-expanded') === 'true'
        })),
        activeTab: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
        openModals: Array.from(modalElements).map(el => el.id || this.generateSelector(el))
      };
    });
  }
}

### How to Scale for Production Use

#### 1. **Infrastructure Scaling**
```
Current: Single Server → Target: Microservices
├── Web Crawler Service (horizontal scaling)
├── API Gateway (load balancing)
├── File Storage Service (CDN integration)
└── Database Cluster (read replicas)
```

#### 2. **Storage Architecture**

**Compression Implementation:**
```typescript
// Add compression to FileManager
import zlib from 'zlib';

class FileManager {
  async writeCompressedFile(filePath: string, content: string | Buffer): Promise<void> {
    const compressed = await zlib.gzip(content);
    await fs.writeFile(filePath + '.gz', compressed);
  }
  
  async readCompressedFile(filePath: string): Promise<Buffer> {
    const compressed = await fs.readFile(filePath + '.gz');
    return await zlib.gunzip(compressed);
  }
}

// Database schema update for compression tracking
model Asset {
  id           String  @id @default(cuid())
  originalSize Int?    // Size before compression
  compressedSize Int?  // Size after compression
  isCompressed Boolean @default(true)
  compression  String  @default("gzip") // gzip, brotli, etc.
}
```

**Cloud Storage Migration (AWS S3):**
```typescript
import AWS from 'aws-sdk';

class S3StorageService {
  private s3: AWS.S3;
  
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
  }

  async uploadArchive(archiveId: string, filePath: string, content: Buffer): Promise<string> {
    const key = `archives/${archiveId}/${filePath}`;
    
    await this.s3.upload({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: content,
      ContentEncoding: 'gzip',
      StorageClass: 'STANDARD_IA', // Cheaper for infrequent access
      ServerSideEncryption: 'AES256'
    }).promise();
    
    return key;
  }

  async getSignedUrl(key: string): Promise<string> {
    return this.s3.getSignedUrl('getObject', {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Expires: 3600 // 1 hour
    });
  }
}
```

**CDN Integration (CloudFront):**
```typescript
// Update schema to track CDN URLs
model Archive {
  id       String @id
  s3Bucket String? // S3 bucket name
  cdnUrl   String? // CloudFront distribution URL
}

// Serve content through CDN
class ArchiveService {
  async getArchivedContentUrl(archiveId: string, filePath: string): Promise<string> {
    const archive = await this.prisma.archive.findUnique({ where: { id: archiveId } });
    
    if (archive?.cdnUrl) {
      return `${archive.cdnUrl}/${filePath}`;
    }
    
    // Fallback to S3 signed URL
    return await this.s3Service.getSignedUrl(`archives/${archiveId}/${filePath}`);
  }
}
```

**Database Sharding Strategy:**
```typescript
// Partition by domain hash
const getShardForDomain = (domain: string): string => {
  const hash = crypto.createHash('md5').update(domain).digest('hex');
  const shardNumber = parseInt(hash.substring(0, 2), 16) % 4; // 4 shards
  return `shard_${shardNumber}`;
};

// Multi-database Prisma setup
const prismaClients = {
  shard_0: new PrismaClient({ datasources: { db: { url: process.env.DB_SHARD_0_URL } } }),
  shard_1: new PrismaClient({ datasources: { db: { url: process.env.DB_SHARD_1_URL } } }),
  shard_2: new PrismaClient({ datasources: { db: { url: process.env.DB_SHARD_2_URL } } }),
  shard_3: new PrismaClient({ datasources: { db: { url: process.env.DB_SHARD_3_URL } } })
};
```

**Redis Caching Layer:**
```typescript
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async cacheArchiveMetadata(archiveId: string, data: any): Promise<void> {
    await this.redis.setex(`archive:${archiveId}`, 3600, JSON.stringify(data));
  }

  async getCachedArchive(archiveId: string): Promise<any | null> {
    const cached = await this.redis.get(`archive:${archiveId}`);
    return cached ? JSON.parse(cached) : null;
  }

  async cacheFrequentContent(key: string, content: Buffer): Promise<void> {
    // Cache frequently accessed assets (CSS, JS libraries)
    await this.redis.setex(`content:${key}`, 86400, content.toString('base64'));
  }
}

#### 3. **Performance & Reliability**

**Queue System Implementation (Bull Queue + Redis):**
```typescript
import Bull from 'bull';

class CrawlerQueue {
  private queue: Bull.Queue;
  
  constructor() {
    this.queue = new Bull('archive crawling', process.env.REDIS_URL);
    this.setupWorkers();
  }

  async addArchiveJob(url: string, options: any = {}): Promise<void> {
    await this.queue.add('crawl-site', { url, ...options }, {
      attempts: 3,
      backoff: 'exponential',
      delay: options.priority === 'high' ? 0 : 5000
    });
  }

  private setupWorkers(): void {
    // Scale workers based on CPU cores
    this.queue.process('crawl-site', require.main?.path + '/workers/crawler-worker.js');
  }
}

// Worker file: workers/crawler-worker.js
module.exports = async (job) => {
  const { url } = job.data;
  const archiveService = new ArchiveService();
  
  job.progress(0);
  await archiveService.createArchive(url);
  job.progress(100);
};
```

**Rate Limiting & Politeness:**
```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';

class PoliteCrawler {
  private rateLimiter: RateLimiterRedis;
  
  constructor() {
    this.rateLimiter = new RateLimiterRedis({
      storeClient: new Redis(process.env.REDIS_URL),
      keyPrefix: 'crawler_rate_limit',
      points: 10, // Number of requests
      duration: 60, // Per 60 seconds by domain
    });
  }

  async respectRateLimit(domain: string): Promise<void> {
    try {
      await this.rateLimiter.consume(domain);
    } catch (rejRes) {
      // Wait until rate limit resets
      await new Promise(resolve => setTimeout(resolve, rejRes.msBeforeNext));
    }
  }

  async checkRobotsTxt(domain: string): Promise<boolean> {
    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await axios.get(robotsUrl);
      
      // Parse robots.txt for crawl-delay and disallow rules
      const rules = this.parseRobotsTxt(response.data);
      return rules.allowed;
    } catch {
      return true; // If no robots.txt, assume allowed
    }
  }
}
```

**Comprehensive Monitoring (Prometheus + Grafana):**
```typescript
import prometheus from 'prom-client';

class MetricsService {
  private archiveCounter: prometheus.Counter;
  private crawlDuration: prometheus.Histogram;
  private storageUsage: prometheus.Gauge;

  constructor() {
    this.archiveCounter = new prometheus.Counter({
      name: 'archives_total',
      help: 'Total number of archives created',
      labelNames: ['status', 'domain']
    });

    this.crawlDuration = new prometheus.Histogram({
      name: 'crawl_duration_seconds',
      help: 'Time taken to crawl a site',
      buckets: [1, 5, 15, 30, 60, 300, 600]
    });

    this.storageUsage = new prometheus.Gauge({
      name: 'storage_usage_bytes',
      help: 'Current storage usage in bytes'
    });
  }

  recordArchiveComplete(domain: string, duration: number): void {
    this.archiveCounter.inc({ status: 'completed', domain });
    this.crawlDuration.observe(duration);
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      storage: await checkStorageHealth()
    }
  };
  res.json(health);
});
```

**Automated Backup Strategy:**
```typescript
import cron from 'node-cron';

class BackupService {
  constructor() {
    // Daily database backups
    cron.schedule('0 2 * * *', () => this.backupDatabase());
    
    // Weekly S3 cross-region replication check
    cron.schedule('0 3 * * 0', () => this.verifyReplication());
  }

  async backupDatabase(): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFile = `backup_${timestamp}.sql`;
    
    // Create database dump
    await exec(`pg_dump ${process.env.DATABASE_URL} > ${backupFile}`);
    
    // Upload to S3 with encryption
    await this.s3.upload({
      Bucket: process.env.BACKUP_BUCKET,
      Key: `database/${backupFile}`,
      Body: fs.createReadStream(backupFile),
      ServerSideEncryption: 'AES256',
      StorageClass: 'GLACIER' // Long-term storage
    }).promise();
    
    // Clean up local file
    await fs.unlink(backupFile);
  }

  async verifyReplication(): Promise<void> {
    // Check cross-region replication status
    const replicationMetrics = await this.s3.getBucketReplication({
      Bucket: process.env.S3_BUCKET_NAME
    }).promise();
    
    // Alert if replication is behind
    if (replicationMetrics.ReplicationConfiguration) {
      // Send alert to monitoring system
    }
  }
}

#### 4. **Security & Compliance**
- **Authentication**: User accounts and access control
- **Content Filtering**: Malware scanning and content policies
- **Privacy Controls**: GDPR compliance and content removal requests
- **API Security**: Rate limiting, authentication, and input validation

#### 5. **Multi-tenancy**
```typescript
// Example: Organization-based isolation
model Organization {
  id       String    @id
  name     String
  archives Archive[]
  users    User[]
}

model User {
  id     String @id
  orgId  String
  role   Role
}
```

#### 6. **Operational Excellence**
- **Docker Containerization**: Consistent deployment environments
- **CI/CD Pipelines**: Automated testing and deployment
- **Feature Flags**: Safe rollout of new functionality
- **Documentation**: API docs, runbooks, and architecture guides

### Production Deployment Strategy

1. **Phase 1**: Single-tenant SaaS with basic scaling
2. **Phase 2**: Multi-tenant platform with organization isolation
3. **Phase 3**: Enterprise features (SSO, compliance, custom retention)
4. **Phase 4**: Global deployment with regional data residency

This architecture provides a solid foundation for a production web archiving service while maintaining the core simplicity that makes the current system effective for personal use. 