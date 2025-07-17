import { Router } from 'express';
import { ArchiveController } from '../controllers/ArchiveController';

const router = Router();
const archiveController = new ArchiveController();

// GET /api/archives - List all archives
router.get('/', archiveController.listArchives);

// GET /api/archives/grouped - Get archives grouped by domain
router.get('/grouped', archiveController.getArchivesByDomain);

// POST /api/archives - Create new archive
router.post('/', archiveController.createArchive);

// GET /api/archives/:id - Get specific archive
router.get('/:id', archiveController.getArchive);

// GET /api/archives/:id/pages - Get pages for an archive
router.get('/:id/pages', archiveController.getArchivePages);

// GET /api/archives/:id/serve/:path* - Serve archived content
router.get('/:id/serve/*', archiveController.serveArchivedContent);

export default router; 