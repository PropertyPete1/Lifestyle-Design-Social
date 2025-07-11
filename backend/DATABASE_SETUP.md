# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Real Estate Auto-Posting App.

## Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** and **npm** installed
3. **Environment variables** configured (see `.env.example`)

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file and update it with your database credentials:

```bash
cp .env.example .env
```

Edit `.env` and update the database configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=real_estate_auto_posting
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Instagram API (Optional)
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback

# File Upload
MAX_FILE_SIZE=100

# App Configuration
NODE_ENV=development
PORT=5000
```

### 3. Setup Database

Run the complete database setup (creates database, runs migrations, and seeds data):

```bash
npm run db:setup
```

This will:
- Create the database if it doesn't exist
- Run all migrations to create tables
- Seed the database with sample data
- Create demo user account

## Database Scripts

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:setup` | Complete database setup (create + migrate + seed) |
| `npm run db:reset` | Drop and recreate everything |
| `npm run db:migrate` | Run migrations only |
| `npm run db:seed` | Seed data only |

### Individual Scripts

```bash
# Migration commands
npm run migrate run      # Run pending migrations
npm run migrate status   # Show migration status
npm run migrate rollback # Rollback last migration

# Seed commands
npm run seed            # Seed database with sample data

# Setup commands
npm run setup-db setup  # Complete setup
npm run setup-db reset  # Reset database
npm run setup-db migrate # Run migrations
npm run setup-db seed   # Seed data
```

## Database Schema

### Tables Overview

| Table | Description |
|-------|-------------|
| `users` | User accounts and Instagram credentials |
| `videos` | Uploaded videos with metadata |
| `posts` | Scheduled and posted content |
| `captions` | Caption templates and generated content |
| `hashtags` | Hashtag management and performance |
| `engagement_insights` | Analytics and engagement data |
| `posting_schedules` | Automated posting schedules |
| `analytics_reports` | Generated analytics reports |

### Key Features

- **UUID Primary Keys** - All tables use UUIDs for better security
- **JSONB Fields** - Flexible storage for complex data (posting times, engagement metrics)
- **Foreign Key Constraints** - Maintains data integrity
- **Indexes** - Optimized for common queries
- **Triggers** - Automatic `updated_at` timestamp updates
- **Check Constraints** - Data validation (status values, categories)

## Demo Data

The seed script creates:

### Demo Users
- **Email**: `demo@lifestyledesignrealty.com`
- **Password**: `demo123`
- **Instagram**: `demo_realtor`

### Sample Videos
1. **Luxury Home Tour - Austin, TX** ($1,250,000)
2. **Funny Real Estate Agent Cartoon** (Humor content)
3. **Modern Condo - Downtown Dallas** ($450,000)

### Caption Templates
- Luxury Property Template
- Casual Property Template
- Funny Cartoon Template

### Hashtags
- Real estate hashtags (`#realestate`, `#homes`, `#property`)
- Location-based hashtags (`#austin`, `#dallas`)
- Cartoon hashtags (`#cartoon`, `#funny`, `#realestatehumor`)

### Posting Schedules
- Default Schedule (3 posts/day, all days)
- Weekend Schedule (2 posts/day, weekends only)

## Database Management

### Backup Database

```bash
pg_dump -h localhost -U postgres real_estate_auto_posting > backup.sql
```

### Restore Database

```bash
psql -h localhost -U postgres real_estate_auto_posting < backup.sql
```

### Reset Database

```bash
npm run db:reset
```

### View Migration Status

```bash
npm run migrate status
```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure PostgreSQL is running
   - Check host/port in `.env`
   - Verify database credentials

2. **Permission Denied**
   - Check PostgreSQL user permissions
   - Ensure user can create databases

3. **Migration Errors**
   - Check if database exists
   - Verify PostgreSQL version (12+ recommended)
   - Check for conflicting migrations

4. **Seed Data Errors**
   - Ensure migrations have run successfully
   - Check for duplicate data conflicts

### Debug Commands

```bash
# Test database connection
psql -h localhost -U postgres -d real_estate_auto_posting -c "SELECT 1"

# View table structure
psql -h localhost -U postgres -d real_estate_auto_posting -c "\d users"

# Check migration status
psql -h localhost -U postgres -d real_estate_auto_posting -c "SELECT * FROM migrations;"
```

## Development Workflow

### Adding New Migrations

1. Create new migration file in `src/scripts/migrations/`
2. Use sequential numbering (e.g., `002_add_new_table.sql`)
3. Include both UP and DOWN migrations
4. Test with `npm run db:reset`

### Adding Seed Data

1. Update `src/scripts/seed.ts`
2. Add new data to appropriate arrays
3. Test with `npm run db:seed`

### Schema Changes

1. Create new migration file
2. Update TypeScript models if needed
3. Test with `npm run db:reset`
4. Update API routes if needed

## Production Deployment

### Environment Variables

Ensure all production environment variables are set:

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_production_db_password
JWT_SECRET=your_production_jwt_secret
```

### Database Setup

```bash
# Run migrations only (no seed data in production)
npm run db:migrate
```

### Monitoring

- Monitor database connections
- Set up automated backups
- Configure connection pooling
- Monitor query performance

## Support

For database-related issues:

1. Check the logs for detailed error messages
2. Verify PostgreSQL installation and configuration
3. Ensure all environment variables are set correctly
4. Test database connection manually
5. Review migration and seed scripts for syntax errors 