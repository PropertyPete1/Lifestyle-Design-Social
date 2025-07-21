"use client";

import { useState } from "react";
import { Sentry, logExamples } from "@/lib/sentry-utils";

export default function SentryErrorTest() {
  const [errorTriggered, setErrorTriggered] = useState(false);

  // Function that will cause an error (undefined function call)
  const triggerUndefinedFunctionError = () => {
    try {
      // This will cause a ReferenceError
      (window as any).myUndefinedFunction();
    } catch (error) {
      // Capture the error in Sentry
      Sentry.captureException(error, {
        tags: {
          error_type: "undefined_function",
          test_page: "sentry-error-test",
        },
        extra: {
          function_name: "myUndefinedFunction",
          timestamp: new Date().toISOString(),
        },
      });

      // Log the error
      logExamples.error("Undefined function called", {
        function_name: "myUndefinedFunction",
        error_message: error instanceof Error ? error.message : "Unknown error",
        stack_trace: error instanceof Error ? error.stack : undefined,
      });

      setErrorTriggered(true);
      alert("Error triggered and sent to Sentry! Check your Sentry dashboard.");
    }
  };

  // Function that will cause an unhandled error (not caught)
  const triggerUnhandledError = () => {
    // This error will not be caught and will be automatically captured by Sentry
    (window as any).anotherUndefinedFunction();
  };

  // Function that demonstrates error tracking with context
  const triggerErrorWithContext = async () => {
    try {
      // Simulate some async operation that fails
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("Simulated async error"));
        }, 100);
      });
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          error_type: "async_error",
          operation: "simulated_operation",
        },
        extra: {
          user_context: "test_user",
          operation_context: "simulated_async_operation",
        },
      });

      logExamples.error("Async operation failed", {
        operation: "simulated_async_operation",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      alert("Async error captured and sent to Sentry!");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sentry Error Tracking Test</h1>

      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Handled Error Test</h2>
          <button
            onClick={triggerUndefinedFunctionError}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Trigger Handled Error
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This will call an undefined function and catch the error, then send
            it to Sentry with context.
          </p>
          {errorTriggered && (
            <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">
              ✅ Error was captured and sent to Sentry!
            </div>
          )}
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Unhandled Error Test</h2>
          <button
            onClick={triggerUnhandledError}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Trigger Unhandled Error
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This will call an undefined function without try-catch. Sentry will
            automatically capture it.
          </p>
        </div>

        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Async Error Test</h2>
          <button
            onClick={triggerErrorWithContext}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Trigger Async Error
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This demonstrates error tracking in async operations with additional
            context.
          </p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">What to Check in Sentry:</h3>
        <ul className="text-sm space-y-1">
          <li>• Error reports with custom tags and context</li>
          <li>• Stack traces for debugging</li>
          <li>• Structured logs with error details</li>
          <li>• Performance impact of errors</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Error Types Demonstrated:</h3>
        <ul className="text-sm space-y-1">
          <li>
            • <strong>ReferenceError</strong>: Undefined function calls
          </li>
          <li>
            • <strong>Handled Errors</strong>: Caught with try-catch and sent to
            Sentry
          </li>
          <li>
            • <strong>Unhandled Errors</strong>: Automatically captured by
            Sentry
          </li>
          <li>
            • <strong>Async Errors</strong>: Errors in async operations
          </li>
        </ul>
      </div>
    </div>
  );
}
