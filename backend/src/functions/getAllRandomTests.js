const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllRandomTests } = require('../controllers/randomTest.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get all RandomTests
app.http('getAllRandomTests', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'randomTest/all',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const randomTests = await getAllRandomTests();
      return {
        status: 200,
        jsonBody: {
          count: randomTests.length,
          randomTests
        }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
