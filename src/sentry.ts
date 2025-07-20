import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN || "https://6c39e11c8a9412e338e7fccbd26202be@o4509696747438080.ingest.us.sentry.io/4509697215758336",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  _experiments: {
    enableLogs: true,
  },
  beforeSend(event) {
    // Optional: sanitize data here
    return event;
  }
});

export const logger = Sentry;
export default Sentry; 