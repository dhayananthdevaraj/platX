// functions/health.js
const { app } = require('@azure/functions');
const connectDB = require('../utils/db');

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: async (request, context) => {
    try {
      // Try DB connection
      await connectDB();

      return {
        status: 200,
        jsonBody: {
          status: "ok",
          message: "Backend is running and DB connected ✅",
          timestamp: new Date().toISOString()
        }
      };
    } catch (err) {
      return {
        status: 503,
        jsonBody: {
          status: "error",
          message: "Backend is running but DB not reachable ❌",
          error: err.message
        }
      };
    }
  }
});
