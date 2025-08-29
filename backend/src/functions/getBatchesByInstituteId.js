const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getBatchesByInstituteId } = require('../controllers/batch.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getBatchesByInstituteId', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'batch/institute/{instituteId}',
  handler: async (request, context) => {
    try {
      verifyToken(request); // Auth check
      await connectDB();

      // ✅ FIXED: Extract from request.params
      const { instituteId } = request.params;

      const batches = await getBatchesByInstituteId(instituteId);

  
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
        jsonBody: { error: err.message || 'Internal Server Error' }
      };
    }
  }
});
