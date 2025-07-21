"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const throwFrontendError = () => {
    throw new Error("🚨 Frontend error triggered!");
  };

  const captureMessage = () => {
    Sentry.captureMessage("🧪 Manual Sentry test message");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Sentry Test Page</h1>
      <button onClick={throwFrontendError}>Trigger Frontend Error</button>
      <br />
      <br />
      <button onClick={captureMessage}>Send Manual Message</button>
    </div>
  );
}
