"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestPage() {
  const testError = () => {
    // Test with a simple error
    throw new Error("🧪 Sentry Test Error - Environment Variable Test");
  };

  const testCaptureException = () => {
    // Test manual error capture
    Sentry.captureException(new Error("📝 Manual Sentry Capture Test"));
    alert("Error captured and sent to Sentry!");
  };

  const testUndefinedFunction = () => {
    // Test the original scenario
    (window as any).myUndefinedFunction();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-6">
      <h1 className="text-3xl font-bold text-center">
        Sentry Environment Test
      </h1>

      <div className="space-y-4 w-full max-w-md">
        <button
          onClick={testError}
          className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
        >
          🧪 Throw Test Error
        </button>

        <button
          onClick={testCaptureException}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          📝 Capture Exception
        </button>

        <button
          onClick={testUndefinedFunction}
          className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
        >
          🔥 Test myUndefinedFunction()
        </button>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg max-w-md">
        <h2 className="font-semibold mb-2">What to check:</h2>
        <ul className="text-sm space-y-1">
          <li>• Your Sentry dashboard for new error reports</li>
          <li>• That errors are going to your correct project</li>
          <li>• Stack traces and browser information</li>
        </ul>
      </div>
    </div>
  );
}
