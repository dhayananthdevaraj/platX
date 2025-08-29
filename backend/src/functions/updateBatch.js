const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { updateBatch } = require('../controllers/batch.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('updateBatch', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'batches/{id}',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();

      const batchId = request.params.id;
      const updateData = await request.json();

      const result = await updateBatch(batchId, updateData);

      return {
        status: 200,
        jsonBody: {
          message: 'Batch updated successfully',
          data: result
        }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Batch update failed' }
      };
    }
  }
});
