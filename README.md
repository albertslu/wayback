# Wayback Archive

A personal web archiving system that captures complete snapshots of websites, preserving them for offline browsing even when original sites become unavailable. This is essentially a private Wayback Machine built with modern web technologies.

## Features

- 📸 Complete website archiving with assets
- 🕒 Scheduled automatic archiving with cron expressions
- 🔍 Browse archived content offline
- 📊 Track archive status and metadata
- 🌐 Modern React frontend with responsive design
- ⚡ Fast Express.js backend with TypeScript

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js, TypeScript, Prisma
- **Database**: PostgreSQL
- **Web Crawling**: Puppeteer, Cheerio
- **Storage**: Local file system for archived content

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd wayback
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database connection string and other settings

# Set up the database
npm run db:generate
npm run db:push

# Start the backend server
npm run dev
```

**Environment Variables** (create `backend/.env`):
```env
DATABASE_URL="postgresql://username:password@localhost:5432/wayback"
PORT=3001
ARCHIVE_BASE_PATH="./archives"
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your backend API URL

# Start the frontend development server
npm run dev
```

**Environment Variables** (create `frontend/.env`):
```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Usage

1. **Create Archive**: Enter a URL on the homepage to start archiving
2. **Monitor Progress**: Track crawling status in real-time
3. **Browse Archives**: View all archived sites organized by domain
4. **Access Content**: Click on archived pages to browse offline content
5. **Schedule Archives**: Set up automatic recurring archives with cron expressions

## Project Structure

```
wayback/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── routes/          # API routes
│   ├── prisma/              # Database schema and migrations
│   └── archives/            # Stored archived content
├── frontend/                # React web application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   └── services/        # API client
└── README.md
```

## API Endpoints

- `GET /api/archives` - List all archives
- `POST /api/archives` - Create new archive
- `GET /api/archives/:id` - Get archive details
- `GET /api/archives/:id/pages` - Get archive pages
- `GET /api/archives/:id/serve/*` - Serve archived content
- `GET /api/scheduler` - List scheduled archives
- `POST /api/scheduler` - Create scheduled archive

## Development

### Backend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio
```

### Frontend Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Deployment

### Backend Deployment

1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred hosting service (Railway, Heroku, etc.)

### Frontend Deployment

The frontend is configured for Vercel deployment:

1. Connect your repository to Vercel
2. Set the root directory to `frontend`
3. Configure environment variables
4. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.