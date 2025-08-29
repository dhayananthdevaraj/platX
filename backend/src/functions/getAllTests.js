const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllTests } = require('../controllers/test.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllTests', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'test/all',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const tests = await getAllTests();
      return { status: 200, jsonBody: { count: tests.length, tests } };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
