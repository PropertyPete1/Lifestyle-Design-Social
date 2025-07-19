# Auto Posting App Backend

This is the backend server for the Auto Posting App, built with Express.js and TypeScript.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/auto-posting-app
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start the production server
- `npm run dev` - Start the development server with hot reload

## API Routes

- `/cartoons` - Cartoon management endpoints
- `/analytics` - Analytics and reporting endpoints  
- `/videos` - Video management and publishing endpoints

## Environment Variables

- `PORT` - Server port (default: 5001)
- `MONGODB_URI` - MongoDB connection string 