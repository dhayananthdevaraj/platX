const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getBatchById } = require('../controllers/batch.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getBatchById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'batches/{id}',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();

      const batchId = request.params.id;
      const result = await getBatchById(batchId);

      return {
        status: 200,
        jsonBody: result
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Batch not found' }
      };
    }
  }
});
