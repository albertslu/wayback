import * as cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { ArchiveService } from './ArchiveService';

interface ScheduledJob {
  id: string;
  task: cron.ScheduledTask;
  url: string;
  schedule: string;
}

export class SchedulerService {
  private prisma: PrismaClient;
  private archiveService: ArchiveService;
  private scheduledJobs: Map<string, ScheduledJob> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.archiveService = new ArchiveService();
  }

  async initializeScheduler() {
    console.log('🕐 Initializing scheduler service...');
    
    // Load all active scheduled archives from database
    const scheduledArchives = await this.prisma.scheduledArchive.findMany({
      where: { isActive: true }
    });

    console.log(`📅 Found ${scheduledArchives.length} active scheduled archives`);

    // Schedule each active archive
    for (const scheduledArchive of scheduledArchives) {
      await this.scheduleArchive(scheduledArchive);
    }

    console.log('✅ Scheduler service initialized');
  }

  async createScheduledArchive(url: string, cronSchedule: string = '0 0 * * 0') {
    try {
      // Validate cron expression
      if (!cron.validate(cronSchedule)) {
        throw new Error('Invalid cron schedule format');
      }

      // Extract domain from URL
      const parsedUrl = new URL(url);
      const domain = parsedUrl.hostname;

      // Check if this URL is already scheduled
      const existing = await this.prisma.scheduledArchive.findFirst({
        where: { url, isActive: true }
      });

      if (existing) {
        throw new Error('This URL is already scheduled for automatic archiving');
      }

      // Calculate next run time
      const nextRun = this.getNextRunTime(cronSchedule);

      // Create scheduled archive record
      const scheduledArchive = await this.prisma.scheduledArchive.create({
        data: {
          url,
          domain,
          cronSchedule,
          nextRun,
          isActive: true
        }
      });

      // Schedule the cron job
      await this.scheduleArchive(scheduledArchive);

      console.log(`📅 Scheduled automatic archiving for ${url} with schedule: ${cronSchedule}`);
      return scheduledArchive;
    } catch (error) {
      console.error('❌ Error creating scheduled archive:', error);
      throw error;
    }
  }

  async updateScheduledArchive(id: string, updates: { cronSchedule?: string; isActive?: boolean }) {
    try {
      const existing = await this.prisma.scheduledArchive.findUnique({
        where: { id }
      });

      if (!existing) {
        throw new Error('Scheduled archive not found');
      }

      // If updating schedule, validate it
      if (updates.cronSchedule && !cron.validate(updates.cronSchedule)) {
        throw new Error('Invalid cron schedule format');
      }

      // Calculate new next run time if schedule is being updated
      const nextRun = updates.cronSchedule ? this.getNextRunTime(updates.cronSchedule) : existing.nextRun;

      // Update database record
      const updatedSchedule = await this.prisma.scheduledArchive.update({
        where: { id },
        data: {
          ...updates,
          nextRun,
          updatedAt: new Date()
        }
      });

      // Remove existing job
      this.removeScheduledJob(id);

      // Reschedule if still active
      if (updatedSchedule.isActive) {
        await this.scheduleArchive(updatedSchedule);
      }

      console.log(`📅 Updated scheduled archive: ${updatedSchedule.url}`);
      return updatedSchedule;
    } catch (error) {
      console.error('❌ Error updating scheduled archive:', error);
      throw error;
    }
  }

  async deleteScheduledArchive(id: string) {
    try {
      // Remove the cron job
      this.removeScheduledJob(id);

      // Delete from database
      await this.prisma.scheduledArchive.delete({
        where: { id }
      });

      console.log(`🗑️ Deleted scheduled archive: ${id}`);
    } catch (error) {
      console.error('❌ Error deleting scheduled archive:', error);
      throw error;
    }
  }

  async getScheduledArchives() {
    return await this.prisma.scheduledArchive.findMany({
      orderBy: { nextRun: 'asc' }
    });
  }

  private async scheduleArchive(scheduledArchive: any) {
    try {
      const task = cron.schedule(scheduledArchive.cronSchedule, async () => {
        console.log(`🚀 Running scheduled archive for: ${scheduledArchive.url}`);
        
        try {
          // Create the archive
          await this.archiveService.createArchive(scheduledArchive.url);
          
          // Update last run time and calculate next run
          const lastRun = new Date();
          const nextRun = this.getNextRunTime(scheduledArchive.cronSchedule);
          
          await this.prisma.scheduledArchive.update({
            where: { id: scheduledArchive.id },
            data: { lastRun, nextRun }
          });

          console.log(`✅ Completed scheduled archive for: ${scheduledArchive.url}`);
        } catch (error) {
          console.error(`❌ Failed scheduled archive for ${scheduledArchive.url}:`, error);
        }
      }, {
        timezone: 'UTC'
      });

      task.start();

      // Store the scheduled job
      this.scheduledJobs.set(scheduledArchive.id, {
        id: scheduledArchive.id,
        task,
        url: scheduledArchive.url,
        schedule: scheduledArchive.cronSchedule
      });

      console.log(`⏰ Scheduled job created for ${scheduledArchive.url} (${scheduledArchive.cronSchedule})`);
    } catch (error) {
      console.error('❌ Error scheduling archive:', error);
      throw error;
    }
  }

  private removeScheduledJob(id: string) {
    const job = this.scheduledJobs.get(id);
    if (job) {
      job.task.stop();
      job.task.destroy();
      this.scheduledJobs.delete(id);
      console.log(`🛑 Removed scheduled job: ${id}`);
    }
  }

  private getNextRunTime(cronSchedule: string): Date {
    // This is a simplified version - in production you'd want a more robust cron parser
    const now = new Date();
    
    // For weekly schedule (0 0 * * 0), next Sunday at midnight
    if (cronSchedule === '0 0 * * 0') {
      const nextSunday = new Date(now);
      nextSunday.setDate(now.getDate() + (7 - now.getDay()) % 7 || 7);
      nextSunday.setHours(0, 0, 0, 0);
      return nextSunday;
    }
    
    // For daily schedule (0 0 * * *), next day at midnight
    if (cronSchedule === '0 0 * * *') {
      const nextDay = new Date(now);
      nextDay.setDate(now.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      return nextDay;
    }
    
    // For testing - every minute (* * * * *)
    if (cronSchedule === '* * * * *') {
      const nextMinute = new Date(now);
      nextMinute.setMinutes(now.getMinutes() + 1);
      nextMinute.setSeconds(0, 0);
      return nextMinute;
    }
    
    // Default: add 7 days for weekly
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    return nextWeek;
  }

  getActiveJobsCount(): number {
    return this.scheduledJobs.size;
  }

  getJobStatus() {
    const jobs = Array.from(this.scheduledJobs.values()).map(job => ({
      id: job.id,
      url: job.url,
      schedule: job.schedule,
      isRunning: job.task.getStatus() === 'scheduled'
    }));

    return {
      totalJobs: jobs.length,
      runningJobs: jobs.filter(job => job.isRunning).length,
      jobs
    };
  }

  shutdown() {
    console.log('🛑 Shutting down scheduler service...');
    
    // Stop all scheduled jobs
    for (const [id, job] of this.scheduledJobs) {
      job.task.stop();
      job.task.destroy();
    }
    
    this.scheduledJobs.clear();
    console.log('✅ Scheduler service shutdown complete');
  }
} 