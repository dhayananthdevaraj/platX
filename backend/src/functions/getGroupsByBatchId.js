const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getGroupsByBatchId } = require('../controllers/group.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// ✅ Get Groups by Batch ID
app.http('getGroupsByBatchId', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'group/batch/{batchId}',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();
      const { batchId } = request.params;
      const result = await getGroupsByBatchId(batchId);
      return { status: 200, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  }
});
