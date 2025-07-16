# Wayback Archive Frontend

A modern web application for archiving websites and preserving digital content.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Vercel

### Option 1: Using Vercel Dashboard

1. Sign up or log in to [Vercel](https://vercel.com)
2. Click "Add New" > "Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables:
   - `VITE_API_URL`: URL of your backend API (e.g., `https://your-backend-url.com/api`)
6. Click "Deploy"

### Option 2: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the frontend directory:
   ```bash
   cd frontend
   vercel
   ```

4. Follow the CLI prompts to configure your project
5. For production deployment:
   ```bash
   vercel --prod
   ```

### Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```
VITE_API_URL=https://your-backend-url.com/api
```

For local development, you can use:
```
VITE_API_URL=http://localhost:3001/api
```

## Features

- Complete website archiving
- Version history tracking
- Permanent access to archived content
- Fast and efficient crawling
- Intuitive browsing interface
