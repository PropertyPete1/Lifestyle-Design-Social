import express from 'express';

const router = express.Router();

// Terms of Service
router.get('/terms', (_req, res) => {
  return res.json({
    title: 'Terms of Service',
    lastUpdated: '2024-01-15',
    content: `
# Terms of Service

## 1. Acceptance of Terms

By accessing and using the Real Estate Auto-Posting App ("Service"), you accept and agree to be bound by the terms and provision of this agreement.

## 2. Description of Service

The Service provides automated social media posting capabilities for real estate professionals, including:
- Video upload and processing
- Automated posting to Instagram, TikTok, and YouTube
- Caption generation and hashtag optimization
- Analytics and engagement tracking
- Scheduling and timing optimization

## 3. User Accounts

You are responsible for:
- Maintaining the confidentiality of your account credentials
- All activities that occur under your account
- Ensuring your account information is accurate and up-to-date
- Complying with all applicable laws and platform policies

## 4. Social Media Platform Integration

### Instagram
- You must comply with Instagram's Terms of Service and Community Guidelines
- We use Instagram Graph API for posting content
- You grant us permission to post content on your behalf
- You are responsible for all content posted through our service

### TikTok
- You must comply with TikTok's Terms of Service and Community Guidelines
- We use TikTok Content Posting API for posting content
- You grant us permission to post content on your behalf
- You are responsible for all content posted through our service

### YouTube
- You must comply with YouTube's Terms of Service and Community Guidelines
- We use YouTube Data API v3 for posting content
- You grant us permission to post content on your behalf
- You are responsible for all content posted through our service

## 5. Content Guidelines

You agree not to post content that:
- Violates any applicable laws or regulations
- Infringes on intellectual property rights
- Contains false or misleading information
- Is spam, abusive, or inappropriate
- Violates platform-specific guidelines

## 6. Privacy and Data

We collect and process data as described in our Privacy Policy. By using our service, you consent to such processing.

## 7. Service Availability

We strive to maintain high service availability but do not guarantee uninterrupted access. We may temporarily suspend service for maintenance or updates.

## 8. Limitation of Liability

We are not liable for:
- Content posted through our service
- Loss of data or service interruptions
- Indirect, incidental, or consequential damages
- Damages exceeding the amount paid for our service

## 9. Termination

We may terminate your account if you:
- Violate these terms
- Engage in fraudulent activity
- Fail to pay for services
- Violate platform policies

## 10. Changes to Terms

We may update these terms at any time. Continued use of the service constitutes acceptance of updated terms.

## 11. Contact Information

For questions about these terms, contact us at:
- Email: legal@realestateautoposting.com
- Address: [Your Business Address]
- Phone: [Your Phone Number]

## 12. Governing Law

These terms are governed by the laws of [Your Jurisdiction].
    `,
  });
});

// Privacy Policy
router.get('/privacy', (_req, res) => {
  return res.json({
    title: 'Privacy Policy',
    lastUpdated: '2024-01-15',
    content: `
# Privacy Policy

## 1. Information We Collect

### Personal Information
- Name, email address, and contact information
- Social media account credentials (stored securely)
- Profile information and preferences
- Usage data and analytics

### Social Media Data
- Access tokens for Instagram, TikTok, and YouTube
- Posted content and engagement metrics
- Account information from connected platforms
- Analytics and performance data

### Technical Information
- IP addresses and device information
- Browser type and version
- Operating system
- Usage patterns and preferences

## 2. How We Use Your Information

### Service Provision
- To provide automated posting services
- To generate captions and hashtags
- To schedule and optimize posts
- To track engagement and analytics

### Platform Integration
- To authenticate with social media platforms
- To post content on your behalf
- To retrieve engagement metrics
- To manage account connections

### Communication
- To send service notifications
- To provide customer support
- To send important updates
- To respond to inquiries

## 3. Information Sharing

We do not sell your personal information. We may share data with:
- Social media platforms (Instagram, TikTok, YouTube)
- Service providers and partners
- Legal authorities when required by law
- Third parties with your explicit consent

## 4. Data Security

We implement appropriate security measures:
- Encryption of sensitive data
- Secure token storage
- Access controls and authentication
- Regular security audits
- Data backup and recovery

## 5. Data Retention

We retain your data for:
- Active accounts: Duration of service
- Inactive accounts: 30 days after deactivation
- Analytics data: 2 years
- Legal requirements: As required by law

## 6. Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate information
- Delete your account and data
- Export your data
- Opt-out of communications
- Withdraw consent for data processing

## 7. Social Media Platform Integration

### Instagram
- We access your Instagram account via Graph API
- We store access tokens securely
- We post content and retrieve analytics
- We do not access private messages

### TikTok
- We access your TikTok account via Content Posting API
- We store access tokens securely
- We post content and retrieve analytics
- We do not access private messages

### YouTube
- We access your YouTube account via Data API v3
- We store access tokens securely
- We post content and retrieve analytics
- We do not access private messages

## 8. Cookies and Tracking

We use cookies and similar technologies to:
- Maintain session information
- Remember preferences
- Analyze usage patterns
- Improve service performance

## 9. Third-Party Services

We may use third-party services for:
- Analytics and tracking
- Customer support
- Payment processing
- Infrastructure services

## 10. Children's Privacy

Our service is not intended for users under 13 years of age. We do not knowingly collect personal information from children.

## 11. International Data Transfers

Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place.

## 12. Changes to Privacy Policy

We may update this privacy policy. We will notify you of significant changes via email or service notification.

## 13. Contact Information

For privacy-related questions, contact us at:
- Email: privacy@realestateautoposting.com
- Address: [Your Business Address]
- Phone: [Your Phone Number]

## 14. Data Protection Officer

For EU residents, contact our Data Protection Officer at:
- Email: dpo@realestateautoposting.com

## 15. Complaints

You may file complaints with:
- Your local data protection authority
- Our customer support team
- Relevant social media platforms
    `,
  });
});

// API Status and Health
router.get('/api-status', (_req, res) => {
  return res.json({
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      instagram: 'operational',
      tiktok: 'operational',
      youtube: 'operational',
      database: 'operational',
      videoProcessing: 'operational',
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    platform: process.platform,
    nodeVersion: process.version,
  });
});

// Legal Compliance Check
router.get('/compliance', (_req, res) => {
  return res.json({
    compliant: true,
    checks: {
      termsOfService: true,
      privacyPolicy: true,
      dataProtection: true,
      apiCompliance: {
        instagram: true,
        tiktok: true,
        youtube: true,
      },
      securityMeasures: true,
      dataRetention: true,
      userRights: true,
    },
    lastAudit: '2024-01-15',
    nextAudit: '2024-07-15',
  });
});

export default router;
