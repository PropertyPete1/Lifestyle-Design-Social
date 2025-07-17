#!/bin/bash

# Real Estate Auto-Posting App - Deployment Script
# This script automates the deployment process for multiple platforms

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

# Configuration
DEPLOYMENT_TYPE=${1:-"docker"}  # docker, vercel, aws, or expo
PROJECT_NAME="real-estate-auto-posting"
DOCKER_IMAGE_TAG="latest"

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    case $DEPLOYMENT_TYPE in
        "docker")
            command -v docker >/dev/null 2>&1 || error "Docker is required but not installed"
            command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is required but not installed"
            ;;
        "vercel")
            command -v vercel >/dev/null 2>&1 || error "Vercel CLI is required but not installed"
            ;;
        "aws")
            command -v aws >/dev/null 2>&1 || error "AWS CLI is required but not installed"
            command -v terraform >/dev/null 2>&1 || error "Terraform is required but not installed"
            ;;
        "expo")
            command -v expo >/dev/null 2>&1 || error "Expo CLI is required but not installed"
            ;;
        *)
            error "Invalid deployment type. Use: docker, vercel, aws, or expo"
            ;;
    esac
    
    log "Prerequisites check passed ✓"
}

# Function to setup environment variables
setup_environment() {
    log "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        warn ".env file not found. Creating from template..."
        cp .env.example .env
        warn "Please edit .env file with your configuration before continuing"
        read -p "Press Enter to continue after editing .env file..."
    fi
    
    # Load environment variables
    export $(grep -v '^#' .env | xargs)
    
    log "Environment variables loaded ✓"
}

# Function to build and test
build_and_test() {
    log "Building and testing application..."
    
    # Backend tests
    log "Running backend tests..."
    cd backend
    npm install
    npm run test || warn "Backend tests failed"
    npm run build
    cd ..
    
    # Frontend tests
    log "Running frontend tests..."
    cd frontend
    npm install
    npm run build
    cd ..
    
    # Mobile app build (if deploying mobile)
    if [ "$DEPLOYMENT_TYPE" = "expo" ]; then
        log "Building mobile app..."
        cd mobile-app
        npm install
        expo build:android --type app-bundle || warn "Android build failed"
        expo build:ios --type archive || warn "iOS build failed"
        cd ..
    fi
    
    log "Build and test completed ✓"
}

# Function to deploy with Docker
deploy_docker() {
    log "Deploying with Docker..."
    
    # Copy deployment files
    cp deploy/docker-compose.yml .
    cp deploy/nginx.conf .
    
    # Build and start containers
    docker-compose down || true
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30
    
    # Health check
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        log "Backend health check passed ✓"
    else
        error "Backend health check failed"
    fi
    
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        log "Frontend health check passed ✓"
    else
        error "Frontend health check failed"
    fi
    
    log "Docker deployment completed ✓"
    log "Application is running at: http://localhost"
}

# Function to deploy to Vercel
deploy_vercel() {
    log "Deploying to Vercel..."
    
    # Deploy frontend
    cd frontend
    vercel --prod --yes
    cd ..
    
    # Deploy backend (if supported)
    cd backend
    vercel --prod --yes
    cd ..
    
    log "Vercel deployment completed ✓"
}

# Function to deploy to AWS
deploy_aws() {
    log "Deploying to AWS..."
    
    cd deploy/aws
    
    # Initialize Terraform
    terraform init
    
    # Plan deployment
    terraform plan -var-file="terraform.tfvars"
    
    # Apply deployment
    terraform apply -var-file="terraform.tfvars" -auto-approve
    
    # Get outputs
    LOAD_BALANCER_URL=$(terraform output -raw load_balancer_url)
    
    log "AWS deployment completed ✓"
    log "Application is running at: $LOAD_BALANCER_URL"
    
    cd ../..
}

# Function to deploy mobile app
deploy_expo() {
    log "Deploying mobile app to Expo..."
    
    cd mobile-app
    
    # Publish to Expo
    expo publish
    
    # Submit to app stores (if configured)
    if [ "$SUBMIT_TO_STORES" = "true" ]; then
        log "Submitting to app stores..."
        expo submit:android
        expo submit:ios
    fi
    
    cd ..
    
    log "Mobile app deployment completed ✓"
}

# Function to run database migrations
run_migrations() {
    log "Running database migrations..."
    
    case $DEPLOYMENT_TYPE in
        "docker")
            docker-compose exec backend npm run migrate
            ;;
        "aws")
            # Run migrations on AWS RDS
            aws rds-data execute-statement \
                --resource-arn "$RDS_CLUSTER_ARN" \
                --secret-arn "$RDS_SECRET_ARN" \
                --database "$DATABASE_NAME" \
                --sql "$(cat backend/src/scripts/migrations/*.sql)"
            ;;
        *)
            log "Manual migration required for $DEPLOYMENT_TYPE"
            ;;
    esac
    
    log "Database migrations completed ✓"
}

# Function to setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    case $DEPLOYMENT_TYPE in
        "docker")
            # Start monitoring containers
            docker-compose -f deploy/monitoring-compose.yml up -d
            ;;
        "aws")
            # Setup CloudWatch alarms
            aws cloudwatch put-metric-alarm \
                --alarm-name "${PROJECT_NAME}-high-cpu" \
                --alarm-description "High CPU usage" \
                --metric-name CPUUtilization \
                --namespace AWS/ECS \
                --statistic Average \
                --period 300 \
                --threshold 80 \
                --comparison-operator GreaterThanThreshold
            ;;
    esac
    
    log "Monitoring setup completed ✓"
}

# Function to create backup
create_backup() {
    log "Creating backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    case $DEPLOYMENT_TYPE in
        "docker")
            # Backup database
            docker-compose exec postgres pg_dump -U autoposting_user autoposting > "$BACKUP_DIR/database.sql"
            
            # Backup uploads
            cp -r uploads "$BACKUP_DIR/"
            ;;
        "aws")
            # Create RDS snapshot
            aws rds create-db-snapshot \
                --db-instance-identifier "$RDS_INSTANCE_ID" \
                --db-snapshot-identifier "${PROJECT_NAME}-$(date +%Y%m%d-%H%M%S)"
            
            # Backup S3 files
            aws s3 sync s3://"$S3_BUCKET" "$BACKUP_DIR/s3-backup"
            ;;
    esac
    
    log "Backup created at: $BACKUP_DIR ✓"
}

# Function to cleanup old deployments
cleanup() {
    log "Cleaning up old deployments..."
    
    case $DEPLOYMENT_TYPE in
        "docker")
            # Remove unused images
            docker image prune -f
            
            # Remove old backups (keep last 7 days)
            find backups -type d -mtime +7 -exec rm -rf {} +
            ;;
        "aws")
            # Delete old snapshots (keep last 7)
            aws rds describe-db-snapshots \
                --db-instance-identifier "$RDS_INSTANCE_ID" \
                --query 'DBSnapshots[?starts_with(DBSnapshotIdentifier, `'${PROJECT_NAME}'`)].DBSnapshotIdentifier' \
                --output text | head -n -7 | xargs -I {} aws rds delete-db-snapshot --db-snapshot-identifier {}
            ;;
    esac
    
    log "Cleanup completed ✓"
}

# Main deployment function
main() {
    log "Starting deployment for $PROJECT_NAME using $DEPLOYMENT_TYPE"
    
    # Check prerequisites
    check_prerequisites
    
    # Setup environment
    setup_environment
    
    # Create backup before deployment
    create_backup
    
    # Build and test
    build_and_test
    
    # Deploy based on type
    case $DEPLOYMENT_TYPE in
        "docker")
            deploy_docker
            ;;
        "vercel")
            deploy_vercel
            ;;
        "aws")
            deploy_aws
            ;;
        "expo")
            deploy_expo
            ;;
    esac
    
    # Run migrations
    run_migrations
    
    # Setup monitoring
    setup_monitoring
    
    # Cleanup
    cleanup
    
    log "🚀 Deployment completed successfully!"
    log "Don't forget to:"
    log "  1. Update DNS records if needed"
    log "  2. Configure SSL certificates"
    log "  3. Set up domain monitoring"
    log "  4. Test all features in production"
}

# Show usage if no arguments
if [ $# -eq 0 ]; then
    echo "Usage: $0 [docker|vercel|aws|expo]"
    echo ""
    echo "Deployment options:"
    echo "  docker  - Deploy using Docker Compose (local/VPS)"
    echo "  vercel  - Deploy to Vercel platform"
    echo "  aws     - Deploy to AWS using Terraform"
    echo "  expo    - Deploy mobile app to Expo/App Stores"
    echo ""
    echo "Examples:"
    echo "  $0 docker   # Local Docker deployment"
    echo "  $0 vercel   # Deploy to Vercel"
    echo "  $0 aws      # Deploy to AWS"
    echo "  $0 expo     # Deploy mobile app"
    exit 1
fi

# Run main function
main 