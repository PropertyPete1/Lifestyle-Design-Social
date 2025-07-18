import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import User from '../models/User';
import { Team } from '../models/Team';
import { TeamMember } from '../models/TeamMember';
import { TeamActivity } from '../models/TeamActivity';
import { PostModel } from '../models/Post';

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'member';
  permissions: Record<string, boolean>;
  invitedBy?: string;
  invitedAt: Date;
  joinedAt?: Date;
  status: 'pending' | 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  // Populated from joins
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  details: Record<string, any>;
  createdAt: Date;
  // Populated from joins
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export interface TeamPost {
  id: string;
  teamId: string;
  postId: string;
  createdBy: string;
  scheduledBy?: string;
  status: 'draft' | 'scheduled' | 'posted' | 'failed';
  scheduledAt?: Date;
  postedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  settings?: Record<string, any>;
}

export interface InviteMemberData {
  email: string;
  role: 'admin' | 'editor' | 'member';
  permissions?: Record<string, boolean>;
}

export class TeamCollaborationService {
  /**
   * Create a new team
   */
  async createTeam(userId: string, teamName: string, description?: string): Promise<any> {
    try {
      await connectToDatabase();

      // Create team
      const team = new Team({
        name: teamName,
        description: description,
        ownerId: userId,
        settings: {},
      });

      const savedTeam = await team.save();

      // Add owner as admin member
      const teamMember = new TeamMember({
        teamId: String(savedTeam._id),
        userId: userId,
        role: 'admin',
        permissions: { all: true },
        status: 'active',
        joinedAt: new Date(),
      });

      await teamMember.save();

      return {
        id: String(savedTeam._id),
        name: savedTeam.name,
        description: savedTeam.description,
        ownerId: savedTeam.ownerId,
        createdAt: savedTeam.createdAt,
        memberCount: 1,
      };
    } catch (error) {
      logger.error('Error creating team:', error);
      throw error;
    }
  }

  /**
   * Get teams for a user
   */
  async getUserTeams(userId: string): Promise<Team[]> {
    try {
      await connectToDatabase();

      const teamMembers = await TeamMember.find({
        userId: userId,
        status: 'active',
      }).sort({ createdAt: -1 });

      const teamIds = teamMembers.map((tm) => tm.teamId);
      const teams = await Team.find({ _id: { $in: teamIds } });

      return teamMembers.map((tm) => {
        const team = teams.find((t) => String(t._id) === tm.teamId);
        return this.mapTeamFromDB({
          ...team?.toObject(),
          role: tm.role,
          status: tm.status,
        });
      });
    } catch (error) {
      logger.error('Error getting user teams:', error);
      throw new Error('Failed to get user teams');
    }
  }

  /**
   * Get team by ID with permission check
   */
  async getTeam(teamId: string, userId: string): Promise<Team | null> {
    try {
      await connectToDatabase();

      const teamMember = await TeamMember.findOne({
        teamId: teamId,
        userId: userId,
        status: 'active',
      });

      if (!teamMember) {
        return null;
      }

      const team = await Team.findById(teamId);

      if (!team) {
        return null;
      }

      return this.mapTeamFromDB({
        ...team.toObject(),
        role: teamMember.role,
        status: teamMember.status,
      });
    } catch (error) {
      logger.error('Error getting team:', error);
      throw new Error('Failed to get team');
    }
  }

  /**
   * Invite member to team
   */
  async inviteMember(
    teamId: string,
    inviterId: string,
    inviteData: InviteMemberData
  ): Promise<TeamMember> {
    try {
      await connectToDatabase();

      // Check if inviter has permission
      const hasPermission = await this.checkPermission(teamId, inviterId, 'manage_members');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to invite members');
      }

      // Find user by email
      const user = await User.findOne({ email: inviteData.email });

      if (!user) {
        throw new Error('User not found');
      }

      const userId = String(user._id);

      // Check if user is already a member
      const existingMember = await TeamMember.findOne({ teamId: teamId, userId: userId });

      if (existingMember) {
        throw new Error('User is already a member of this team');
      }

      // Create team member invitation
      const teamMember = new TeamMember({
        teamId: teamId,
        userId: userId,
        role: inviteData.role,
        permissions: inviteData.permissions || {},
        invitedBy: inviterId,
        status: 'pending',
      });

      const savedMember = await teamMember.save();

      const member = this.mapTeamMemberFromDB(savedMember.toObject());

      // Log activity
      await this.logActivity(teamId, inviterId, 'member_invited', 'user', userId, {
        invitedEmail: inviteData.email,
        role: inviteData.role,
      });

      logger.info(`Member invited to team ${teamId}: ${inviteData.email} as ${inviteData.role}`);
      return member;
    } catch (error) {
      logger.error('Error inviting member:', error);
      throw error;
    }
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(teamId: string, userId: string): Promise<TeamMember> {
    try {
      await connectToDatabase();

      // Update member status
      const updatedMember = await TeamMember.findOneAndUpdate(
        { teamId: teamId, userId: userId, status: 'pending' },
        {
          status: 'active',
          joinedAt: new Date(),
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!updatedMember) {
        throw new Error('Invitation not found or already accepted');
      }

      const member = this.mapTeamMemberFromDB(updatedMember.toObject());

      // Log activity
      await this.logActivity(teamId, userId, 'member_joined', 'user', userId, {
        role: member.role,
      });

      logger.info(`User ${userId} accepted invitation to team ${teamId}`);
      return member;
    } catch (error) {
      logger.error('Error accepting invitation:', error);
      throw error;
    }
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: string, userId: string): Promise<TeamMember[]> {
    try {
      await connectToDatabase();

      // Check if user is a member
      const isMember = await this.checkMembership(teamId, userId);
      if (!isMember) {
        throw new Error('Access denied');
      }

      const teamMembers = await TeamMember.find({ teamId: teamId }).sort({ role: 1, joinedAt: -1 });

      const userIds = teamMembers.map((tm) => tm.userId);
      const users = await User.find({ _id: { $in: userIds } }).select('email name');

      return teamMembers.map((tm) => {
        const user = users.find((u) => String(u._id) === tm.userId);
        return this.mapTeamMemberFromDB({
          ...tm.toObject(),
          user: user
            ? {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
              }
            : undefined,
        });
      });
    } catch (error) {
      logger.error('Error getting team members:', error);
      throw error;
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    teamId: string,
    userId: string,
    newRole: string,
    updatedBy: string
  ): Promise<any> {
    try {
      await connectToDatabase();

      // Check permissions
      const updaterMember = await TeamMember.findOne({
        teamId: teamId,
        userId: updatedBy,
      });

      if (!updaterMember) {
        throw new Error('Updater is not a team member');
      }

      const updaterRole = updaterMember.role;
      if (updaterRole !== 'admin' && updaterRole !== 'owner') {
        throw new Error('Insufficient permissions to update roles');
      }

      // Update role
      const updatedMember = await TeamMember.findOneAndUpdate(
        { teamId: teamId, userId: userId },
        {
          role: newRole as 'admin' | 'editor' | 'member',
          permissions: this.getDefaultPermissions(newRole),
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!updatedMember) {
        throw new Error('Member not found');
      }

      return {
        id: updatedMember._id.toString(),
        teamId: updatedMember.teamId,
        userId: updatedMember.userId,
        role: updatedMember.role,
        permissions: updatedMember.permissions,
        updatedAt: updatedMember.updatedAt,
      };
    } catch (error) {
      logger.error('Error updating member role:', error);
      throw error;
    }
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, removerId: string, memberId: string): Promise<void> {
    try {
      await connectToDatabase();

      // Check permissions
      const hasPermission = await this.checkPermission(teamId, removerId, 'manage_members');
      if (!hasPermission) {
        throw new Error('Insufficient permissions');
      }

      // Cannot remove team owner
      const member = await TeamMember.findOne({ teamId: teamId, userId: memberId });

      if (!member) {
        throw new Error('Member not found');
      }

      if (member.role === 'owner') {
        throw new Error('Cannot remove team owner');
      }

      // Remove member
      await TeamMember.deleteOne({ teamId: teamId, userId: memberId });

      // Log activity
      await this.logActivity(teamId, removerId, 'member_removed', 'user', memberId, {
        removedRole: member.role,
      });

      logger.info(`Member removed from team ${teamId}: ${memberId}`);
    } catch (error) {
      logger.error('Error removing member:', error);
      throw error;
    }
  }

  /**
   * Get team activity log
   */
  async getTeamActivity(
    teamId: string,
    userId: string,
    limit: number = 50
  ): Promise<TeamActivity[]> {
    try {
      await connectToDatabase();

      // Check if user is a member
      const isMember = await this.checkMembership(teamId, userId);
      if (!isMember) {
        throw new Error('Access denied');
      }

      const activities = await TeamActivity.find({ teamId: teamId })
        .sort({ createdAt: -1 })
        .limit(limit);

      const userIds = activities.map((a) => a.userId);
      const users = await User.find({ _id: { $in: userIds } }).select('email name');

      return activities.map((activity) => {
        const user = users.find((u) => u._id.toString() === activity.userId);
        return this.mapTeamActivityFromDB({
          ...activity.toObject(),
          user: user
            ? {
                id: user._id.toString(),
                email: user.email,
                name: user.name,
              }
            : undefined,
        });
      });
    } catch (error) {
      logger.error('Error getting team activity:', error);
      throw error;
    }
  }

  /**
   * Log team activity
   */
  async logActivity(
    teamId: string,
    userId: string,
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await connectToDatabase();

      const activity = new TeamActivity({
        teamId: teamId,
        userId: userId,
        action: action,
        resourceType: resourceType,
        resourceId: resourceId,
        details: details || {},
      });

      await activity.save();
    } catch (error) {
      logger.error('Error logging team activity:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(teamId: string, userId: string, permission: string): Promise<boolean> {
    try {
      await connectToDatabase();

      const member = await TeamMember.findOne({
        teamId: teamId,
        userId: userId,
        status: 'active',
      });

      if (!member) {
        return false;
      }

      const role = member.role;
      const permissions = member.permissions;

      // Owner and admin have all permissions
      if (role === 'owner' || role === 'admin') {
        return true;
      }

      // Check specific permissions
      return permissions[permission] === true;
    } catch (error) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if user is a member of team
   */
  async checkMembership(teamId: string, userId: string): Promise<boolean> {
    try {
      await connectToDatabase();

      const member = await TeamMember.findOne({
        teamId: teamId,
        userId: userId,
        status: 'active',
      });

      return !!member;
    } catch (error) {
      logger.error('Error checking membership:', error);
      return false;
    }
  }

  /**
   * Get team statistics
   */
  async getTeamStats(teamId: string): Promise<any> {
    try {
      await connectToDatabase();

      const totalMembers = await TeamMember.countDocuments({ teamId });
      const activeMembers = await TeamMember.countDocuments({
        teamId,
        status: 'active',
      });
      const pendingInvitations = await TeamMember.countDocuments({
        teamId,
        status: 'pending',
      });

      // Get team members for post counting
      const teamMembers = await TeamMember.find({ teamId, status: 'active' })
        .select('userId')
        .lean();
      const memberUserIds = teamMembers.map((member) => member.userId);

      // Count posts for all team members
      const totalPosts = await PostModel.countDocuments({
        userId: { $in: memberUserIds },
      });

      const scheduledPosts = await PostModel.countDocuments({
        userId: { $in: memberUserIds },
        status: 'scheduled',
      });

      return {
        totalMembers,
        activeMembers,
        pendingInvitations,
        totalPosts,
        scheduledPosts,
        recentActivity: await TeamActivity.countDocuments({
          teamId: teamId,
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
      };
    } catch (error) {
      logger.error('Error getting team stats:', error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        pendingInvitations: 0,
        totalPosts: 0,
        scheduledPosts: 0,
        recentActivity: 0,
      };
    }
  }

  /**
   * Private helper methods
   */
  private mapTeamFromDB(row: any): Team {
    return {
      id: String(row._id || row.id || ''),
      name: String(row.name || ''),
      description: String(row.description || ''),
      ownerId: String(row.ownerId || row.owner_id || ''),
      settings: row.settings || {},
      createdAt: row.createdAt || row.created_at || new Date(),
      updatedAt: row.updatedAt || row.updated_at || new Date(),
    };
  }

  private mapTeamMemberFromDB(row: any): TeamMember {
    return {
      id: String(row._id || row.id || ''),
      teamId: String(row.teamId || row.team_id || ''),
      userId: String(row.userId || row.user_id || ''),
      role: row.role || 'member',
      permissions: row.permissions || {},
      invitedBy: row.invitedBy || row.invited_by,
      invitedAt: row.invitedAt || row.invited_at || new Date(),
      joinedAt: row.joinedAt || row.joined_at,
      status: row.status || 'pending',
      createdAt: row.createdAt || row.created_at || new Date(),
      updatedAt: row.updatedAt || row.updated_at || new Date(),
      user: row.user,
    };
  }

  private mapTeamActivityFromDB(row: any): TeamActivity {
    return {
      id: String(row._id || row.id || ''),
      teamId: String(row.teamId || row.team_id || ''),
      userId: String(row.userId || row.user_id || ''),
      action: String(row.action || ''),
      resourceType: row.resourceType || row.resource_type,
      resourceId: row.resourceId || row.resource_id,
      details: row.details || {},
      createdAt: row.createdAt || row.created_at || new Date(),
      user: row.user,
    };
  }

  private getDefaultPermissions(role: string): Record<string, boolean> {
    switch (role) {
      case 'admin':
        return {
          manage_members: true,
          manage_posts: true,
          view_analytics: true,
          manage_settings: true,
        };
      case 'editor':
        return {
          manage_posts: true,
          view_analytics: true,
        };
      case 'member':
        return {
          view_analytics: false,
        };
      default:
        return {
          manage_posts: false,
          view_analytics: false,
        };
    }
  }
}

export const teamCollaborationService = new TeamCollaborationService();
