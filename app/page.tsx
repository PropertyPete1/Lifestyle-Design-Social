'use client';

import { logger } from "../sentry.client.config";

export default function Home() {
  const handleTestLog = () => {
    logger.captureMessage("User clicked test button", {
      level: "info",
      tags: { component: "HomePage" }
    });
  };

  const handleTestError = () => {
    try {
      throw new Error("This is a test error from the frontend!");
    } catch (err) {
      logger.captureException(err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-yellow-400">
          Lifestyle Design Social
        </h1>
        
        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-yellow-300">
            Auto-Posting Platform
          </h2>
          <p className="text-gray-300 mb-4">
            Your automated social media posting platform is running successfully!
          </p>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={handleTestLog}
                className="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded font-semibold transition-colors"
              >
                Test Sentry Log
              </button>
              
              <button
                onClick={handleTestError}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold transition-colors"
              >
                Test Sentry Error
              </button>
            </div>
            
            <div className="text-sm text-gray-400">
              <p>✅ Backend: http://localhost:5001</p>
              <p>✅ Frontend: http://localhost:3000</p>
              <p>✅ Sentry: Configured and monitoring</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-yellow-300">
              Features Ready
            </h3>
            <ul className="text-gray-300 space-y-2">
              <li>✅ OpenAI API Integration</li>
              <li>✅ Instagram Graph API</li>
              <li>✅ YouTube Data API</li>
              <li>✅ AWS S3 Storage</li>
              <li>✅ MongoDB Database</li>
              <li>✅ JWT Authentication</li>
              <li>✅ Sentry Monitoring</li>
            </ul>
          </div>
          
          <div className="bg-gray-900 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-yellow-300">
              Development Status
            </h3>
            <ul className="text-gray-300 space-y-2">
              <li>✅ Environment Variables</li>
              <li>✅ TypeScript Configuration</li>
              <li>✅ Next.js 15 Setup</li>
              <li>✅ Express Backend</li>
              <li>✅ Error Monitoring</li>
              <li>✅ Performance Tracking</li>
              <li>✅ Console Logging</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 