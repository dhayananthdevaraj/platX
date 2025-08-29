const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllTestVisibilities } = require('../controllers/testVisibility.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllTestVisibilities', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'test-visibility/all',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const visibilities = await getAllTestVisibilities();
      return { status: 200, jsonBody: { count: visibilities.length, visibilities } };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
