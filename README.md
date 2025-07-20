# Backend Retry & Alert System

This backend includes:
- Retry mechanism for failed posts
- Cron job to auto-retry every 15 mins
- Email alerts after 3 failures
- Manual retry API route at `POST /api/retry/manual`

Set your alert email credentials in `.env` file:
```
ALERT_EMAIL_USER=your-email@gmail.com  
ALERT_EMAIL_PASS=your-password
``` 