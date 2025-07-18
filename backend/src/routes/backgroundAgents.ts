import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { backgroundAgentsService } from '../services/backgroundAgentsService';
import { logger } from '../utils/logger';

const router = Router();

// @route   GET /api/background-agents/agents
// @desc    Get all background agents
// @access  Private
router.get('/agents', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const agents = backgroundAgentsService.getAgents();

    return res.json({
      success: true,
      data: {
        agents,
        totalAgents: agents.length,
        activeAgents: agents.filter((a) => a.status === 'active').length,
        stoppedAgents: agents.filter((a) => a.status === 'stopped').length,
      },
      message: `Retrieved ${agents.length} background agents`,
    });
  } catch (error) {
    logger.error('Background agents retrieval error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve background agents',
    });
  }
});

// @route   GET /api/background-agents/agent/:agentId
// @desc    Get specific background agent
// @access  Private
router.get('/agent/:agentId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    const agent = backgroundAgentsService.getAgent(agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Background agent not found',
      });
    }

    return res.json({
      success: true,
      data: agent,
      message: 'Background agent retrieved successfully',
    });
  } catch (error) {
    logger.error('Background agent retrieval error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve background agent',
    });
  }
});

// @route   POST /api/background-agents/agent/:agentId/start
// @desc    Start a background agent
// @access  Private
router.post('/agent/:agentId/start', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    await backgroundAgentsService.startAgent(agentId);

    return res.json({
      success: true,
      message: 'Background agent started successfully',
    });
  } catch (error) {
    logger.error('Background agent start error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start background agent',
    });
  }
});

// @route   POST /api/background-agents/agent/:agentId/stop
// @desc    Stop a background agent
// @access  Private
router.post('/agent/:agentId/stop', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    await backgroundAgentsService.stopAgent(agentId);

    return res.json({
      success: true,
      message: 'Background agent stopped successfully',
    });
  } catch (error) {
    logger.error('Background agent stop error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to stop background agent',
    });
  }
});

// @route   POST /api/background-agents/agent/:agentId/run
// @desc    Run a background agent manually
// @access  Private
router.post('/agent/:agentId/run', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res.status(400).json({ error: 'Agent ID is required' });
    }

    const report = await backgroundAgentsService.runAgent(agentId);

    return res.json({
      success: true,
      data: report,
      message: 'Background agent executed successfully',
    });
  } catch (error) {
    logger.error('Background agent execution error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute background agent',
    });
  }
});

// @route   GET /api/background-agents/reports
// @desc    Get agent reports
// @access  Private
router.get('/reports', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { agentId, limit = 50 } = req.query;

    const reports = await backgroundAgentsService.getAgentReports(
      agentId as string,
      parseInt(limit as string)
    );

    return res.json({
      success: true,
      data: {
        reports,
        totalReports: reports.length,
      },
      message: `Retrieved ${reports.length} agent reports`,
    });
  } catch (error) {
    logger.error('Agent reports retrieval error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent reports',
    });
  }
});

// @route   POST /api/background-agents/initialize
// @desc    Initialize background agents system
// @access  Private
router.post('/initialize', authenticateToken, async (_req: Request, res: Response) => {
  try {
    await backgroundAgentsService.initialize();

    return res.json({
      success: true,
      message: 'Background agents system initialized successfully',
    });
  } catch (error) {
    logger.error('Background agents initialization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initialize background agents system',
    });
  }
});

// @route   GET /api/background-agents/status
// @desc    Get background agents system status
// @access  Private
router.get('/status', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const agents = backgroundAgentsService.getAgents();

    const systemStatus = {
      initialized: agents.length > 0,
      totalAgents: agents.length,
      activeAgents: agents.filter((a) => a.status === 'active').length,
      pausedAgents: agents.filter((a) => a.status === 'paused').length,
      stoppedAgents: agents.filter((a) => a.status === 'stopped').length,
      agentTypes: {
        codebase_scanner: agents.filter((a) => a.type === 'codebase_scanner').length,
        error_detector: agents.filter((a) => a.type === 'error_detector').length,
        performance_monitor: agents.filter((a) => a.type === 'performance_monitor').length,
        security_scanner: agents.filter((a) => a.type === 'security_scanner').length,
        optimization_finder: agents.filter((a) => a.type === 'optimization_finder').length,
      },
      lastActivity:
        agents.length > 0 ? Math.max(...agents.map((a) => a.lastRun?.getTime() || 0)) : null,
      nextScheduledRun:
        agents.length > 0
          ? Math.min(...agents.filter((a) => a.nextRun).map((a) => a.nextRun!.getTime()))
          : null,
    };

    return res.json({
      success: true,
      data: systemStatus,
      message: 'Background agents system status retrieved successfully',
    });
  } catch (error) {
    logger.error('Background agents status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve background agents status',
    });
  }
});

// @route   GET /api/background-agents/analytics
// @desc    Get background agents analytics
// @access  Private
router.get('/analytics', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const agents = backgroundAgentsService.getAgents();
    const reports = await backgroundAgentsService.getAgentReports(undefined, 100);

    // Calculate analytics
    const totalRuns = agents.reduce((sum, agent) => sum + (agent.metrics?.totalRuns || 0), 0);
    const totalSuccessfulRuns = agents.reduce(
      (sum, agent) => sum + (agent.metrics?.successfulRuns || 0),
      0
    );
    const totalFailedRuns = agents.reduce(
      (sum, agent) => sum + (agent.metrics?.failedRuns || 0),
      0
    );
    const totalIssuesFound = agents.reduce(
      (sum, agent) => sum + (agent.metrics?.issuesFound || 0),
      0
    );
    const totalIssuesResolved = agents.reduce(
      (sum, agent) => sum + (agent.metrics?.issuesResolved || 0),
      0
    );

    const successRate = totalRuns > 0 ? Math.round((totalSuccessfulRuns / totalRuns) * 100) : 0;
    const resolutionRate =
      totalIssuesFound > 0 ? Math.round((totalIssuesResolved / totalIssuesFound) * 100) : 0;

    // Recent activity
    const recentReports = reports.slice(0, 10);
    const criticalFindings = reports.reduce(
      (sum, report) => sum + report.findings.filter((f: any) => f.severity === 'critical').length,
      0
    );

    // Performance metrics
    const averageRunTime =
      agents.length > 0
        ? Math.round(
            agents.reduce((sum, agent) => sum + (agent.metrics?.averageRunTime || 0), 0) /
              agents.length
          )
        : 0;

    const analytics = {
      overview: {
        totalAgents: agents.length,
        activeAgents: agents.filter((a) => a.status === 'active').length,
        totalRuns,
        successRate,
        averageRunTime,
      },
      performance: {
        totalSuccessfulRuns,
        totalFailedRuns,
        averageRunTime,
        fastestAgent:
          agents.reduce(
            (fastest, agent) =>
              !fastest ||
              (agent.metrics?.averageRunTime || 0) < (fastest.metrics?.averageRunTime || 0)
                ? agent
                : fastest,
            null as any
          )?.name || 'N/A',
      },
      issues: {
        totalIssuesFound,
        totalIssuesResolved,
        resolutionRate,
        criticalFindings,
        mostActiveAgent:
          agents.reduce(
            (most, agent) =>
              !most || (agent.metrics?.issuesFound || 0) > (most.metrics?.issuesFound || 0)
                ? agent
                : most,
            null as any
          )?.name || 'N/A',
      },
      recentActivity: recentReports.map((report) => ({
        agentName: agents.find((a) => a.id === report.agentId)?.name || 'Unknown',
        status: report.status,
        findings: report.findings.length,
        duration: report.duration,
        timestamp: report.startTime,
      })),
    };

    return res.json({
      success: true,
      data: analytics,
      message: 'Background agents analytics retrieved successfully',
    });
  } catch (error) {
    logger.error('Background agents analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve background agents analytics',
    });
  }
});

export default router;
