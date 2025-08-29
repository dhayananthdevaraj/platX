const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getStudentsByBatch } = require('../controllers/user.controller');
// const { verifyToken } = require('../middleware/auth.middleware');

app.http('getStudentsByBatch', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'students/batch/{batchId}',
  handler: async (request, context) => {
    try {
      // verifyToken(request); // Uncomment if using token-based auth
      await connectDB();      
      const batchId = request.params.batchId;
      if (!batchId) {
        return {
          status: 400,
          jsonBody: { message: 'Batch ID is required' }
        };
      }

      const result = await getStudentsByBatch(batchId);

      return {
        status: 200,
        jsonBody: result
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Failed to fetch students' }
      };
    }
  }
});
