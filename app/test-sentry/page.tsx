"use client";

import { useState } from "react";

export default function TestSentryPage() {
  const [errorTriggered, setErrorTriggered] = useState(false);

  const triggerError = () => {
    try {
      // This will throw an error because myUndefinedFunction is not defined
      (window as any).myUndefinedFunction();
    } catch (error) {
      console.error("Error triggered:", error);
      setErrorTriggered(true);
    }
  };

  const triggerAsyncError = async () => {
    try {
      // Simulate an async error
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error("Async error test"));
        }, 100);
      });
    } catch (error) {
      console.error("Async error triggered:", error);
      setErrorTriggered(true);
    }
  };

  const triggerManualError = () => {
    try {
      throw new Error("Manual error test");
    } catch (error) {
      console.error("Manual error triggered:", error);
      setErrorTriggered(true);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sentry Test Page</h1>
      <p>Click the buttons below to trigger Sentry errors:</p>
      
      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          style={{
            padding: '0.5rem 1rem',
            background: 'red',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
          onClick={triggerError}
        >
          🚨 Trigger myUndefinedFunction() Error
        </button>
        
        <button
          style={{
            padding: '0.5rem 1rem',
            background: 'orange',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
          onClick={triggerAsyncError}
        >
          ⏰ Trigger Async Error
        </button>
        
        <button
          style={{
            padding: '0.5rem 1rem',
            background: 'purple',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px'
          }}
          onClick={triggerManualError}
        >
          💥 Throw Manual Error
        </button>
      </div>
      
      {errorTriggered && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
          ✅ Error triggered! Check your Sentry dashboard.
        </div>
      )}
    </div>
  );
} 