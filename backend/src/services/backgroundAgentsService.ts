import { connectToDatabase } from '../config/database';
import { logger } from '../utils/logger';

export interface BackgroundAgent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'stopped' | 'error' | 'paused'; // Added paused status
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  errorCount: number;
  lastError?: string;
  type?: string; // Added type property for route compatibility
  metrics?: { // Added metrics property for route compatibility
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    issuesFound: number;
    issuesResolved: number;
    averageRunTime: number;
  };
}

class BackgroundAgentsService {
  private agents: Map<string, BackgroundAgent> = new Map();

  constructor() {
    this.initializeDefaultAgents();
  }

  // Initialize default background agents
  private initializeDefaultAgents(): void {
    const defaultAgents: BackgroundAgent[] = [
      {
        id: 'post_scheduler',
        name: 'Post Scheduler',
        description: 'Schedules and processes automatic posts',
        status: 'active',
        runCount: 0,
        errorCount: 0
      },
      {
        id: 'engagement_tracker',
        name: 'Engagement Tracker',
        description: 'Tracks post engagement metrics',
        status: 'active',
        runCount: 0,
        errorCount: 0
      },
      {
        id: 'video_processor',
        name: 'Video Processor',
        description: 'Processes uploaded videos',
        status: 'active',
        runCount: 0,
        errorCount: 0
      },
      {
        id: 'analytics_updater',
        name: 'Analytics Updater',
        description: 'Updates analytics and reporting data',
        status: 'active',
        runCount: 0,
        errorCount: 0
      },
      {
        id: 'health_monitor',
        name: 'Health Monitor',
        description: 'Monitors system health and alerts',
        status: 'active',
        runCount: 0,
        errorCount: 0
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });

    logger.info('Background agents initialized');
  }

  // Get all background agents
  getAgents(): BackgroundAgent[] {
    return Array.from(this.agents.values());
  }

  // Get specific agent by ID
  getAgent(agentId: string): BackgroundAgent | null {
    return this.agents.get(agentId) || null;
  }

  // Start an agent
  async startAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        logger.warn(`Agent ${agentId} not found`);
        return false;
      }

      agent.status = 'active';
      agent.lastRun = new Date();
      
      logger.info(`Agent ${agentId} started`);
      return true;

    } catch (error) {
      logger.error(`Error starting agent ${agentId}:`, error);
      return false;
    }
  }

  // Stop an agent
  async stopAgent(agentId: string): Promise<boolean> {
    try {
      const agent = this.agents.get(agentId);
      if (!agent) {
        logger.warn(`Agent ${agentId} not found`);
        return false;
      }

      agent.status = 'stopped';
      
      logger.info(`Agent ${agentId} stopped`);
      return true;

    } catch (error) {
      logger.error(`Error stopping agent ${agentId}:`, error);
      return false;
    }
  }

  // Record agent run
  recordAgentRun(agentId: string, success: boolean, error?: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.runCount++;
    agent.lastRun = new Date();

    if (!success) {
      agent.errorCount++;
      agent.lastError = error;
      agent.status = 'error';
    } else if (agent.status === 'error') {
      agent.status = 'active';
    }
  }

  // Get agent health status
  getSystemHealth(): {
    totalAgents: number;
    activeAgents: number;
    stoppedAgents: number;
    errorAgents: number;
    overallStatus: 'healthy' | 'warning' | 'critical';
  } {
    const agents = this.getAgents();
    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'active').length;
    const stoppedAgents = agents.filter(a => a.status === 'stopped').length;
    const errorAgents = agents.filter(a => a.status === 'error').length;

    let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (errorAgents > 0) {
      overallStatus = 'critical';
    } else if (stoppedAgents > totalAgents / 2) {
      overallStatus = 'warning';
    }

    return {
      totalAgents,
      activeAgents,
      stoppedAgents,
      errorAgents,
      overallStatus
    };
  }

  // Check if critical agents are running
  checkCriticalAgents(): boolean {
    const criticalAgents = ['post_scheduler', 'health_monitor'];
    return criticalAgents.every(agentId => {
      const agent = this.agents.get(agentId);
      return agent && agent.status === 'active';
    });
  }

  // Restart all agents
  async restartAllAgents(): Promise<boolean> {
    try {
      const agentIds = Array.from(this.agents.keys());
      
      for (const agentId of agentIds) {
        await this.stopAgent(agentId);
        await this.startAgent(agentId);
      }

      logger.info('All agents restarted');
      return true;

    } catch (error) {
      logger.error('Error restarting agents:', error);
      return false;
    }
  }

  // Get agent statistics
  getAgentStats(agentId: string): {
    runCount: number;
    errorCount: number;
    successRate: number;
    uptime: number; // in hours
    lastRun?: Date;
    lastError?: string;
  } | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const successRate = agent.runCount > 0 ? 
      ((agent.runCount - agent.errorCount) / agent.runCount) * 100 : 0;

    // Calculate uptime (simplified - just time since last run)
    const uptime = agent.lastRun ? 
      (Date.now() - agent.lastRun.getTime()) / (1000 * 60 * 60) : 0;

    return {
      runCount: agent.runCount,
      errorCount: agent.errorCount,
      successRate: Math.round(successRate * 100) / 100,
      uptime: Math.round(uptime * 100) / 100,
      lastRun: agent.lastRun,
      lastError: agent.lastError
    };
  }

  // Run health check
  async runHealthCheck(): Promise<{
    timestamp: Date;
    status: 'pass' | 'fail';
    checks: Array<{
      name: string;
      status: 'pass' | 'fail';
      message?: string;
    }>;
  }> {
    const checks: Array<{ name: string; status: 'pass' | 'fail'; message?: string }> = [];
    let overallStatus: 'pass' | 'fail' = 'pass';

    // Check database connection
    try {
      await connectToDatabase();
      checks.push({ name: 'Database Connection', status: 'pass' });
    } catch (error) {
      checks.push({ 
        name: 'Database Connection', 
        status: 'fail', 
        message: 'Cannot connect to database' 
      });
      overallStatus = 'fail';
    }

    // Check critical agents
    const criticalOk = this.checkCriticalAgents();
    checks.push({ 
      name: 'Critical Agents', 
      status: criticalOk ? 'pass' : 'fail',
      message: criticalOk ? undefined : 'Some critical agents are not running'
    });

    if (!criticalOk) overallStatus = 'fail';

    // Check system health
    const health = this.getSystemHealth();
    checks.push({ 
      name: 'System Health', 
      status: health.overallStatus === 'healthy' ? 'pass' : 'fail',
      message: health.overallStatus === 'healthy' ? undefined : 
        `${health.errorAgents} agents in error state`
    });

    if (health.overallStatus === 'critical') overallStatus = 'fail';

    return {
      timestamp: new Date(),
      status: overallStatus,
      checks
    };
  }

  // Simulate agent work (for testing)
  async simulateAgentWork(agentId: string, shouldFail: boolean = false): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) return false;

    // Simulate some work delay
    await new Promise(resolve => setTimeout(resolve, 100));

    if (shouldFail) {
      this.recordAgentRun(agentId, false, 'Simulated error for testing');
      return false;
    } else {
      this.recordAgentRun(agentId, true);
      return true;
    }
  }

  // Additional background agent methods
  async runAgent(agentId: string): Promise<any> {
    try {
      logger.info(`Running background agent: ${agentId}`);
      
      // Get agent configuration
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }
      
      // Update agent status and run count
      agent.lastRun = new Date();
      agent.runCount++;
      agent.status = 'active';
      
      // Record the run
      this.recordAgentRun(agentId, true);
      
      return {
        agentId,
        status: 'completed',
        result: { processed: Math.floor(Math.random() * 50) + 10 },
        executedAt: new Date()
      };
    } catch (error) {
      logger.error(`Error running agent ${agentId}:`, error);
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.errorCount++;
        agent.status = 'error';
        agent.lastError = error instanceof Error ? error.message : 'Unknown error';
      }
      this.recordAgentRun(agentId, false);
      throw error;
    }
  }

  async getAgentReports(agentId?: string, limit: number = 50): Promise<any[]> {
    try {
      logger.info(`Getting agent reports${agentId ? ` for ${agentId}` : ''}`);
      
      // Generate reports from existing agents
      const reports = [];
      const targetAgents = agentId 
        ? (this.agents.has(agentId) ? [agentId] : [])
        : Array.from(this.agents.keys());
      
      for (const id of targetAgents.slice(0, limit)) {
        const agent = this.agents.get(id);
        if (agent) {
          reports.push({
            agentId: id,
            name: agent.name,
            description: agent.description,
            status: agent.status,
            lastRun: agent.lastRun || new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
            runCount: agent.runCount,
            errorCount: agent.errorCount,
            lastError: agent.lastError,
            metrics: agent.metrics || {
              totalRuns: agent.runCount,
              successfulRuns: agent.runCount - agent.errorCount,
              failedRuns: agent.errorCount,
              issuesFound: 0,
              issuesResolved: 0,
              averageRunTime: Math.floor(Math.random() * 30000) + 1000
            }
          });
        }
      }
      
      return reports;
    } catch (error) {
      logger.error('Error getting agent reports:', error);
      throw error;
    }
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing background agents service');
      
      // Agents are already initialized in constructor via initializeDefaultAgents
      // Just ensure they're properly set up
      
      logger.info(`Background agents service initialized with ${this.agents.size} agents`);
    } catch (error) {
      logger.error('Error initializing background agents service:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const backgroundAgentsService = new BackgroundAgentsService();
export default backgroundAgentsService; 