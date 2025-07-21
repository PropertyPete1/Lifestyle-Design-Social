import * as Sentry from "@sentry/nextjs";

// Get the logger instance for structured logging
export const { logger } = Sentry;

/**
 * Utility function to wrap async operations with Sentry error tracking
 */
export const withSentryErrorTracking = <T>(
  operation: () => Promise<T>,
  operationName: string,
  context?: Record<string, any>,
): Promise<T> => {
  return Sentry.startSpan(
    {
      op: "function",
      name: operationName,
    },
    async (span) => {
      try {
        // Add context to the span if provided
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            span.setAttribute(key, value);
          });
        }

        const result = await operation();
        return result;
      } catch (error) {
        // Capture the exception in Sentry
        Sentry.captureException(error, {
          tags: {
            operation: operationName,
          },
          extra: context,
        });
        throw error;
      }
    },
  );
};

/**
 * Utility function for API calls with Sentry tracing
 */
export const fetchWithSentry = async <T>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `${options?.method || "GET"} ${url}`,
    },
    async (span) => {
      try {
        // Add request details to span
        span.setAttribute("http.url", url);
        span.setAttribute("http.method", options?.method || "GET");

        if (options?.headers) {
          span.setAttribute(
            "http.request_headers",
            JSON.stringify(options.headers),
          );
        }

        const response = await fetch(url, options);
        const data = await response.json();

        // Add response details to span
        span.setAttribute("http.status_code", response.status);
        span.setAttribute("http.response_size", JSON.stringify(data).length);

        return data as T;
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            operation: "fetch",
            url,
          },
        });
        throw error;
      }
    },
  );
};

/**
 * Utility function for UI interactions with Sentry tracing
 */
export const trackUIInteraction = (
  interactionName: string,
  interaction: () => void | Promise<void>,
  context?: Record<string, any>,
) => {
  return Sentry.startSpan(
    {
      op: "ui.interaction",
      name: interactionName,
    },
    async (span) => {
      try {
        // Add context to the span
        if (context) {
          Object.entries(context).forEach(([key, value]) => {
            span.setAttribute(key, value);
          });
        }

        await interaction();
      } catch (error) {
        Sentry.captureException(error, {
          tags: {
            interaction: interactionName,
          },
          extra: context,
        });
        throw error;
      }
    },
  );
};

/**
 * Utility function for button clicks with Sentry tracing
 */
export const trackButtonClick = (
  buttonName: string,
  onClick: () => void | Promise<void>,
  context?: Record<string, any>,
) => {
  return trackUIInteraction(`Button Click: ${buttonName}`, onClick, {
    ...context,
    interaction_type: "button_click",
  });
};

/**
 * Example usage of structured logging with Sentry logger
 */
export const logExamples = {
  trace: (message: string, context?: Record<string, any>) => {
    logger.trace(message, context);
  },

  debug: (message: string, context?: Record<string, any>) => {
    logger.debug(message, context);
  },

  info: (message: string, context?: Record<string, any>) => {
    logger.info(message, context);
  },

  warn: (message: string, context?: Record<string, any>) => {
    logger.warn(message, context);
  },

  error: (message: string, context?: Record<string, any>) => {
    logger.error(message, context);
  },

  fatal: (message: string, context?: Record<string, any>) => {
    logger.fatal(message, context);
  },

  // Template literal function for structured logging
  fmt: logger.fmt,
};

// Export Sentry for direct use when needed
export { Sentry };
