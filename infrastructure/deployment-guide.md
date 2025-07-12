# 🚀 Real Estate Auto-Posting SaaS - Complete Deployment Guide

## 📋 Prerequisites

### Required Accounts & Services
- [ ] AWS Account with billing enabled
- [ ] Vercel Account (connected to GitHub)
- [ ] Expo Account with EAS Build access
- [ ] Domain name purchased
- [ ] SSL certificate (Let's Encrypt or AWS Certificate Manager)

### Required Tools
```bash
# Install required CLI tools
npm install -g @aws-cli/cli
npm install -g vercel
npm install -g @expo/cli
npm install -g eas-cli

# Verify installations
aws --version
vercel --version
expo --version
eas --version
```

## 🗄️ Phase 1: Database Setup (PostgreSQL on AWS RDS)

### 1.1 Create RDS Instance
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier realestate-autopost-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 20 \
  --storage-type gp2 \
  --master-username dbadmin \
  --master-user-password "YourSecurePassword123!" \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted \
  --deletion-protection
```

### 1.2 Database Configuration
```sql
-- Connect to PostgreSQL and run setup
CREATE DATABASE realestate_autopost;
CREATE USER app_user WITH PASSWORD 'your_app_password';
GRANT ALL PRIVILEGES ON DATABASE realestate_autopost TO app_user;

-- Enable required extensions
\c realestate_autopost;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### 1.3 Run Migrations
```bash
# From packages/database directory
export DATABASE_URL="postgresql://app_user:password@your-rds-endpoint:5432/realestate_autopost"
npm run migrate:up
npm run seed:production
```

## 🖥️ Phase 2: Backend API Deployment (AWS EC2/ECS)

### 2.1 Create Production Environment Files
```bash
# Create production .env file
cat > apps/api/.env.production << EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://app_user:password@your-rds-endpoint:5432/realestate_autopost
REDIS_URL=redis://your-elasticache-endpoint:6379

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=7d

# Social Platform APIs
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
YOUTUBE_CLIENT_ID=your_youtube_client_id
YOUTUBE_CLIENT_SECRET=your_youtube_client_secret

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key

# AWS Services
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=realestate-autopost-uploads

# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn

# CORS
CORS_ORIGIN=https://yourdomain.com,https://api.yourdomain.com
EOF
```

### 2.2 Docker Configuration
```dockerfile
# apps/api/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN npm ci --only=production && npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3001
CMD ["node", "dist/app.js"]
```

### 2.3 Deploy to AWS ECS
```bash
# Build and push Docker image
docker build -t realestate-autopost-api:latest apps/api/
docker tag realestate-autopost-api:latest your-account.dkr.ecr.us-east-1.amazonaws.com/realestate-autopost-api:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/realestate-autopost-api:latest

# Create ECS task definition
aws ecs register-task-definition --cli-input-json file://infrastructure/aws/ecs-task-definition.json

# Create ECS service
aws ecs create-service \
  --cluster realestate-autopost-cluster \
  --service-name api-service \
  --task-definition realestate-autopost-api:1 \
  --desired-count 2 \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/api-targets/1234567890123456,containerName=api,containerPort=3001
```

## 🌐 Phase 3: Web Frontend Deployment (Vercel)

### 3.1 Environment Configuration
```bash
# Set Vercel environment variables
vercel env add API_URL production
# Enter: https://api.yourdomain.com

vercel env add NEXT_PUBLIC_APP_URL production  
# Enter: https://yourdomain.com

vercel env add NEXT_PUBLIC_GOOGLE_ANALYTICS_ID production
# Enter: GA-XXXXXXXXX

vercel env add NEXT_PUBLIC_SENTRY_DSN production
# Enter: your-sentry-dsn
```

### 3.2 Production Build Configuration
```javascript
// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  images: {
    domains: ['yourdomain.com', 'api.yourdomain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizeCss: true,
    optimizeImages: true,
  },
};

module.exports = nextConfig;
```

### 3.3 Deploy to Vercel
```bash
# From apps/web directory
vercel --prod

# Configure custom domain
vercel domains add yourdomain.com
vercel alias https://your-app-xxx.vercel.app yourdomain.com
```

## 📱 Phase 4: Mobile App Deployment (Expo/EAS)

### 4.1 Configure EAS Build
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### 4.2 Environment Configuration
```javascript
// apps/mobile/app.config.js
export default {
  expo: {
    name: "Real Estate AutoPost",
    slug: "realestate-autopost",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourdomain.realestateautopost"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.yourdomain.realestateautopost"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || "https://api.yourdomain.com",
      googleAnalyticsId: process.env.EXPO_PUBLIC_GOOGLE_ANALYTICS_ID,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      eas: {
        projectId: "your-eas-project-id"
      }
    }
  }
};
```

### 4.3 Build and Submit
```bash
# Build for production
eas build --platform all --profile production

# Submit to app stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## 🔧 Phase 5: Infrastructure Configuration

### 5.1 CloudFront CDN Setup
```json
{
  "CallerReference": "realestate-autopost-cdn",
  "Comment": "CDN for Real Estate Auto-Posting SaaS",
  "Origins": {
    "Quantity": 2,
    "Items": [
      {
        "Id": "S3-uploads",
        "DomainName": "realestate-autopost-uploads.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      },
      {
        "Id": "API-origin",
        "DomainName": "api.yourdomain.com",
        "CustomOriginConfig": {
          "HTTPPort": 443,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-uploads",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
```

### 5.2 SSL Certificate Setup
```bash
# Request SSL certificate via AWS Certificate Manager
aws acm request-certificate \
  --domain-name yourdomain.com \
  --subject-alternative-names *.yourdomain.com \
  --validation-method DNS \
  --region us-east-1
```

### 5.3 Load Balancer Configuration
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name realestate-autopost-alb \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-xxxxxxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4
```

## 🔐 Phase 6: Security & Monitoring

### 6.1 AWS Secrets Manager Setup
```bash
# Store sensitive configuration
aws secretsmanager create-secret \
  --name "realestate-autopost/production" \
  --description "Production secrets for Real Estate Auto-Posting SaaS" \
  --secret-string '{
    "DATABASE_URL": "postgresql://app_user:password@endpoint:5432/db",
    "JWT_SECRET": "your-jwt-secret",
    "OPENAI_API_KEY": "sk-your-openai-key",
    "INSTAGRAM_CLIENT_SECRET": "your-instagram-secret"
  }'
```

### 6.2 CloudWatch Monitoring
```javascript
// Monitoring dashboard configuration
const dashboardBody = {
  widgets: [
    {
      type: "metric",
      properties: {
        metrics: [
          ["AWS/ECS", "CPUUtilization", "ServiceName", "api-service"],
          ["AWS/ECS", "MemoryUtilization", "ServiceName", "api-service"],
          ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "app/realestate-autopost-alb"],
          ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "app/realestate-autopost-alb"]
        ],
        period: 300,
        stat: "Average",
        region: "us-east-1",
        title: "API Performance Metrics"
      }
    }
  ]
};
```

### 6.3 Security Groups
```bash
# Create security group for RDS
aws ec2 create-security-group \
  --group-name rds-postgres-sg \
  --description "Security group for PostgreSQL RDS"

# Allow inbound PostgreSQL from ECS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxxxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-yyyyyyyy
```

## 🚀 Phase 7: Go-Live Checklist

### 7.1 Pre-Launch Testing
- [ ] Load testing with 100+ concurrent users
- [ ] Database connection pooling configured
- [ ] All API endpoints returning expected responses
- [ ] File uploads working to S3
- [ ] Social media OAuth flows functional
- [ ] Mobile app push notifications working
- [ ] Email notifications sending correctly
- [ ] Payment processing (if implemented) working
- [ ] Error monitoring capturing issues
- [ ] Log aggregation configured

### 7.2 Performance Optimization
```bash
# Enable gzip compression
curl -H "Accept-Encoding: gzip" -I https://yourdomain.com

# Test Core Web Vitals
npm install -g lighthouse
lighthouse https://yourdomain.com --view

# Database query optimization
EXPLAIN ANALYZE SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10;
```

### 7.3 Backup & Disaster Recovery
```bash
# Set up automated RDS backups
aws rds modify-db-instance \
  --db-instance-identifier realestate-autopost-prod \
  --backup-retention-period 30 \
  --apply-immediately

# S3 bucket versioning and lifecycle policy
aws s3api put-bucket-versioning \
  --bucket realestate-autopost-uploads \
  --versioning-configuration Status=Enabled
```

## 📊 Phase 8: Monitoring & Maintenance

### 8.1 Application Monitoring
```javascript
// Sentry configuration
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 8.2 Health Checks
```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    checks: {
      database: 'OK', // Add actual DB health check
      redis: 'OK',     // Add actual Redis health check
      s3: 'OK'         // Add actual S3 health check
    }
  };
  res.status(200).json(healthCheck);
});
```

### 8.3 Automated Scaling
```yaml
# ECS Auto Scaling configuration
AutoScalingTarget:
  Type: AWS::ApplicationAutoScaling::ScalableTarget
  Properties:
    MaxCapacity: 10
    MinCapacity: 2
    ResourceId: service/realestate-autopost-cluster/api-service
    RoleARN: !GetAtt ApplicationAutoScalingECSRole.Arn
    ScalableDimension: ecs:service:DesiredCount
    ServiceNamespace: ecs
```

## 🎯 Phase 9: Post-Launch Operations

### 9.1 User Analytics Setup
```javascript
// Google Analytics 4 configuration
gtag('config', 'GA_MEASUREMENT_ID', {
  page_title: 'Real Estate Auto-Posting SaaS',
  page_location: window.location.href,
  custom_map: {
    'custom_parameter': 'user_type'
  }
});
```

### 9.2 Performance Monitoring Dashboard
```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name "RealEstateAutoPost-Production" \
  --dashboard-body file://infrastructure/aws/cloudwatch-dashboard.json
```

### 9.3 Automated Alerts
```yaml
# CloudWatch Alarms
HighCPUAlarm:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: HighCPUUtilization
    AlarmDescription: Alarm when CPU exceeds 80%
    MetricName: CPUUtilization
    Namespace: AWS/ECS
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 80
    ComparisonOperator: GreaterThanThreshold
```

## 📈 Success Metrics

### Key Performance Indicators
- **Uptime**: > 99.9%
- **Response Time**: < 200ms (API), < 3s (Web)
- **Error Rate**: < 0.1%
- **Database Performance**: < 100ms query time
- **Mobile App Performance**: < 2s launch time

### Scaling Thresholds
- **Users**: Auto-scale ECS at 70% CPU
- **Database**: Monitor connection count (max 100)
- **Storage**: Monitor S3 usage and costs
- **API Rate Limiting**: 1000 requests/hour per user

## 🔄 Maintenance Schedule

### Daily
- [ ] Monitor error rates and performance metrics
- [ ] Check automated backup completion
- [ ] Review security alerts

### Weekly  
- [ ] Database performance optimization
- [ ] Cost analysis and optimization
- [ ] Security updates and patches

### Monthly
- [ ] Disaster recovery testing
- [ ] Performance load testing
- [ ] Security audit and penetration testing
- [ ] Business continuity plan review

---

## 🆘 Emergency Procedures

### Database Recovery
```bash
# Restore from backup
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier realestate-autopost-restored \
  --db-snapshot-identifier realestate-autopost-snapshot-20231201
```

### Application Rollback
```bash
# Rollback ECS service
aws ecs update-service \
  --cluster realestate-autopost-cluster \
  --service api-service \
  --task-definition realestate-autopost-api:previous-version
```

### Traffic Rerouting
```bash
# Update Route 53 record for emergency maintenance
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch file://emergency-maintenance-page.json
```

This deployment guide ensures a production-ready, scalable, and maintainable Real Estate Auto-Posting SaaS application with enterprise-grade security and monitoring. 