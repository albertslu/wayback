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
- **Concurrent Crawling**: Implement worker pools for parallel page processing
- **Incremental Updates**: Only re-crawl changed content instead of full site snapshots
- **Content Deduplication**: Share common assets (libraries, fonts) across archives

#### 3. **User Experience Improvements**
- **Real-time Progress**: WebSocket connections for live crawling updates
- **Preview Generation**: Thumbnail screenshots of archived pages
- **Advanced Search**: Full-text search across archived content
- **Comparison Views**: Side-by-side comparison of different archive versions

#### 4. **Content Fidelity**
- **Dynamic Content Capture**: Better handling of SPAs and JavaScript-heavy sites
- **Media Support**: Video and audio content preservation
- **Interactive Elements**: Form state and dynamic functionality preservation

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
- **Object Storage**: Migrate from file system to AWS S3/CloudFlare R2
- **CDN Integration**: Serve archived content through global CDN
- **Database Sharding**: Partition archives by domain or date ranges
- **Caching Layer**: Redis for metadata and frequently accessed content

#### 3. **Performance & Reliability**
- **Queue System**: Redis/RabbitMQ for crawling job management
- **Rate Limiting**: Respect robots.txt and implement polite crawling
- **Monitoring**: Comprehensive logging, metrics, and alerting
- **Backup Strategy**: Automated backups with geographic distribution

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