import { Request, Response, NextFunction } from 'express';
import { SchedulerService } from '../services/SchedulerService';
import { createError } from '../middleware/errorHandler';

export class SchedulerController {
  private schedulerService: SchedulerService;

  constructor(schedulerService: SchedulerService) {
    this.schedulerService = schedulerService;
  }

  // GET /api/scheduler/scheduled-archives - Get all scheduled archives
  getScheduledArchives = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const scheduledArchives = await this.schedulerService.getScheduledArchives();

      res.json({
        success: true,
        data: scheduledArchives
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/scheduler/scheduled-archives - Create a new scheduled archive
  createScheduledArchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { url, cronSchedule } = req.body;

      if (!url) {
        throw createError('URL is required', 400);
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        throw createError('Invalid URL format', 400);
      }

      const scheduledArchive = await this.schedulerService.createScheduledArchive(url, cronSchedule);

      res.status(201).json({
        success: true,
        data: scheduledArchive
      });
    } catch (error) {
      next(error);
    }
  };

  // PUT /api/scheduler/scheduled-archives/:id - Update a scheduled archive
  updateScheduledArchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { cronSchedule, isActive } = req.body;

      const updates: { cronSchedule?: string; isActive?: boolean } = {};
      
      if (cronSchedule !== undefined) updates.cronSchedule = cronSchedule;
      if (isActive !== undefined) updates.isActive = isActive;

      const updatedSchedule = await this.schedulerService.updateScheduledArchive(id, updates);

      res.json({
        success: true,
        data: updatedSchedule
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE /api/scheduler/scheduled-archives/:id - Delete a scheduled archive
  deleteScheduledArchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await this.schedulerService.deleteScheduledArchive(id);

      res.json({
        success: true,
        message: 'Scheduled archive deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  // GET /api/scheduler/status - Get scheduler status and job information
  getSchedulerStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = this.schedulerService.getJobStatus();

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      next(error);
    }
  };

  // POST /api/scheduler/scheduled-archives/:id/toggle - Toggle a scheduled archive on/off
  toggleScheduledArchive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      
      // Get current state
      const scheduledArchives = await this.schedulerService.getScheduledArchives();
      const current = scheduledArchives.find((sa: any) => sa.id === id);
      
      if (!current) {
        throw createError('Scheduled archive not found', 404);
      }

      // Toggle the active state
      const updatedSchedule = await this.schedulerService.updateScheduledArchive(id, {
        isActive: !current.isActive
      });

      res.json({
        success: true,
        data: updatedSchedule
      });
    } catch (error) {
      next(error);
    }
  };
} 