import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';
import { connectToDatabase } from '../config/database';
import { User } from '../models/User';

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
  manualEntryKey: string;
}

export interface TwoFactorVerificationResult {
  success: boolean;
  message: string;
}

class TwoFactorService {
  /**
   * Generate 2FA setup for a user
   */
  async generateSetup(userId: string, userEmail: string): Promise<TwoFactorSetupResult> {
    try {
      await connectToDatabase();

      // Check if user already has 2FA enabled
      const isEnabled = await this.isTwoFactorEnabled(userId);
      
      if (isEnabled) {
        throw new Error('Two-factor authentication is already enabled');
      }

      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `Real Estate Auto-Posting (${userEmail})`,
        issuer: 'Real Estate Auto-Posting App',
        length: 32
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store in database (but don't enable yet)
      await this.storeTwoFactorSecret(userId, secret.base32, backupCodes);

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
        manualEntryKey: secret.base32
      };

    } catch (error) {
      logger.error('Error generating 2FA setup:', error);
      throw new Error('Failed to generate two-factor authentication setup');
    }
  }

  /**
   * Enable 2FA after verification
   */
  async enable2FA(userId: string, token: string): Promise<TwoFactorVerificationResult> {
    try {
      await connectToDatabase();

      // Get user's stored secret
      const user = await this.getUserTwoFactorData(userId);
      
      if (!user || !user.twoFactorSecret) {
        return {
          success: false,
          message: 'Two-factor authentication setup not found. Please start setup again.'
        };
      }

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!verified) {
        return {
          success: false,
          message: 'Invalid verification code. Please try again.'
        };
      }

      // Enable 2FA in database
      await this.enableTwoFactor(userId);

      logger.info(`2FA enabled for user ${userId}`);

      return {
        success: true,
        message: 'Two-factor authentication enabled successfully.'
      };

    } catch (error) {
      logger.error('Error enabling 2FA:', error);
      throw new Error('Failed to enable two-factor authentication');
    }
  }

  /**
   * Verify 2FA token or backup code
   */
  async verifyToken(userId: string, token: string): Promise<TwoFactorVerificationResult> {
    try {
      await connectToDatabase();

      const user = await this.getUserTwoFactorData(userId);
      
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return {
          success: false,
          message: 'Two-factor authentication is not enabled for this account.'
        };
      }

      // Check if it's a backup code (8 characters, alphanumeric)
      if (token.length === 8 && /^[A-Z0-9]+$/.test(token)) {
        const isValidBackupCode = await this.useBackupCode(userId, token);
        
        if (isValidBackupCode) {
          return {
            success: true,
            message: 'Backup code verified successfully.'
          };
        }
      }

      // Verify TOTP token
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token,
        window: 2
      });

      if (verified) {
        return {
          success: true,
          message: 'Authentication successful.'
        };
      }

      return {
        success: false,
        message: 'Invalid authentication code.'
      };

    } catch (error) {
      logger.error('Error verifying 2FA token:', error);
      return {
        success: false,
        message: 'Authentication verification failed.'
      };
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      await connectToDatabase();
      
      // Disable 2FA
      await User.findByIdAndUpdate(userId, {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null,
        updatedAt: new Date()
      });

      logger.info(`2FA disabled for user ${userId}`);

      return {
        success: true,
        message: 'Two-factor authentication disabled successfully.'
      };

    } catch (error) {
      logger.error('Error disabling 2FA:', error);
      throw new Error('Failed to disable two-factor authentication');
    }
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string, token: string): Promise<string[]> {
    try {
      await connectToDatabase();
      
      // Verify current token
      const verification = await this.verifyToken(userId, token);
      
      if (!verification.success) {
        throw new Error('Invalid authentication code');
      }

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes();

      // Update in database
      await User.findByIdAndUpdate(userId, {
        backupCodes: backupCodes,
        updatedAt: new Date()
      });

      logger.info(`New backup codes generated for user ${userId}`);

      return backupCodes;

    } catch (error) {
      logger.error('Error generating backup codes:', error);
      throw new Error('Failed to generate backup codes');
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      await connectToDatabase();
      
      const user = await User.findById(userId).select('twoFactorEnabled');
      
      if (!user) {
        return false;
      }

      return Boolean(user.twoFactorEnabled) || false;

    } catch (error) {
      logger.error('Error checking 2FA status:', error);
      return false;
    }
  }

  /**
   * Private helper methods
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < 10; i++) {
      // Generate 8-character alphanumeric backup codes
      const code = randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  private async storeTwoFactorSecret(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      twoFactorSecret: secret,
      backupCodes: backupCodes,
      updatedAt: new Date()
    });
  }

  private async enableTwoFactor(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      twoFactorEnabled: true,
      twoFactorSetupAt: new Date(),
      updatedAt: new Date()
    });
  }

  private async getUserTwoFactorData(userId: string): Promise<{
    twoFactorEnabled: boolean;
    twoFactorSecret: string | null;
    backupCodes: string[] | null;
  } | null> {
    const user = await User.findById(userId).select('twoFactorEnabled twoFactorSecret backupCodes');
    
    if (!user) {
      return null;
    }
    
    return {
      twoFactorEnabled: Boolean(user.twoFactorEnabled) || false,
      twoFactorSecret: user.twoFactorSecret || null,
      backupCodes: user.backupCodes || null
    };
  }

  private async useBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const user = await User.findById(userId).select('backupCodes');
      
      if (!user || !user.backupCodes) {
        return false;
      }

      const codeIndex = user.backupCodes.indexOf(code);
      
      if (codeIndex === -1) {
        return false;
      }

      // Remove the used backup code
      user.backupCodes.splice(codeIndex, 1);

      // Update database
      await User.findByIdAndUpdate(userId, {
        backupCodes: user.backupCodes,
        updatedAt: new Date()
      });

      return true;

    } catch (error) {
      logger.error('Error using backup code:', error);
      return false;
    }
  }
}

export const twoFactorService = new TwoFactorService(); 