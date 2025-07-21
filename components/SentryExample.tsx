"use client";

import { useState } from "react";
import {
  trackButtonClick,
  fetchWithSentry,
  withSentryErrorTracking,
  logExamples,
  Sentry,
} from "@/lib/sentry-utils";

export default function SentryExample() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Example of button click tracking with Sentry
  const handleTestButtonClick = () => {
    trackButtonClick(
      "Test Button",
      async () => {
        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Log the action
        logExamples.info("Test button clicked", {
          timestamp: new Date().toISOString(),
          user_action: "test_button_click",
        });

        alert("Test button clicked! Check Sentry for the trace.");
      },
      {
        button_id: "test-button",
        page: "sentry-example",
      },
    );
  };

  // Example of API call with Sentry tracing
  const handleFetchData = async () => {
    setLoading(true);

    try {
      const result = await fetchWithSentry("/api/sentry-example-api");
      setData(result);

      logExamples.info("Data fetched successfully", {
        data_size: JSON.stringify(result).length,
        endpoint: "/api/sentry-example-api",
      });
    } catch (error) {
      logExamples.error("Failed to fetch data", {
        endpoint: "/api/sentry-example-api",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Example of custom span instrumentation
  const handleCustomSpan = () => {
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Custom Span Example",
      },
      (span) => {
        const config = "example_config";
        const metric = "example_metric";

        // Add metrics to the span
        span.setAttribute("config", config);
        span.setAttribute("metric", metric);

        // Simulate some work
        setTimeout(() => {
          span.setAttribute("work_completed", true);
          logExamples.debug("Custom span work completed", { config, metric });
        }, 500);

        alert("Custom span created! Check Sentry for the trace.");
      },
    );
  };

  // Example of error tracking with try-catch
  const handleErrorExample = async () => {
    try {
      await withSentryErrorTracking(
        async () => {
          // Simulate an error
          throw new Error("This is a test error for Sentry");
        },
        "Error Example Operation",
        {
          operation_type: "test_error",
          user_id: "example_user",
        },
      );
    } catch (error) {
      // Error is automatically captured by withSentryErrorTracking
      console.log("Error caught and sent to Sentry:", error);
    }
  };

  // Example of structured logging with template literals
  const handleStructuredLogging = () => {
    const userId = "user_123";
    const action = "structured_logging_test";

    logExamples.trace("Starting structured logging test", { userId, action });
    logExamples.debug(
      logExamples.fmt`Processing user: ${userId} with action: ${action}`,
    );
    logExamples.info("Structured logging completed", {
      userId,
      action,
      success: true,
    });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sentry Integration Examples</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Button Click Tracking</h2>
          <button
            onClick={handleTestButtonClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Button Click
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This demonstrates button click tracking with custom context.
          </p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">API Call Tracing</h2>
          <button
            onClick={handleFetchData}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Fetch Data"}
          </button>
          {data && (
            <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">
            Custom Span Instrumentation
          </h2>
          <button
            onClick={handleCustomSpan}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Create Custom Span
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This demonstrates manual span creation with attributes.
          </p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Error Tracking</h2>
          <button
            onClick={handleErrorExample}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Trigger Test Error
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This demonstrates exception catching and error tracking.
          </p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Structured Logging</h2>
          <button
            onClick={handleStructuredLogging}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Test Structured Logging
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This demonstrates structured logging with template literals.
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">What to Check in Sentry:</h3>
        <ul className="text-sm space-y-1">
          <li>• Performance traces for button clicks and API calls</li>
          <li>• Error reports with context and tags</li>
          <li>• Structured logs with custom attributes</li>
          <li>• Session replay data for user interactions</li>
        </ul>
      </div>
    </div>
  );
}
