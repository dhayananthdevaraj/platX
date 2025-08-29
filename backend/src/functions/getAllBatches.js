const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllBatches } = require('../controllers/batch.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllBatches', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'batches',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();

      const batches = await getAllBatches();

      return {
        status: 200,
        jsonBody: {
          count: batches.length,
          batches
        }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Failed to retrieve batches' }
      };
    }
  }
});
