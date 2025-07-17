import { Router } from 'express';
import { SchedulerController } from '../controllers/SchedulerController';

export const createSchedulerRoutes = (schedulerController: SchedulerController) => {
  const router = Router();

  // GET /api/scheduler/scheduled-archives - Get all scheduled archives
  router.get('/scheduled-archives', schedulerController.getScheduledArchives);

  // POST /api/scheduler/scheduled-archives - Create a new scheduled archive
  router.post('/scheduled-archives', schedulerController.createScheduledArchive);

  // PUT /api/scheduler/scheduled-archives/:id - Update a scheduled archive
  router.put('/scheduled-archives/:id', schedulerController.updateScheduledArchive);

  // DELETE /api/scheduler/scheduled-archives/:id - Delete a scheduled archive
  router.delete('/scheduled-archives/:id', schedulerController.deleteScheduledArchive);

  // POST /api/scheduler/scheduled-archives/:id/toggle - Toggle a scheduled archive
  router.post('/scheduled-archives/:id/toggle', schedulerController.toggleScheduledArchive);

  // GET /api/scheduler/status - Get scheduler status
  router.get('/status', schedulerController.getSchedulerStatus);

  return router;
};

export default createSchedulerRoutes; 