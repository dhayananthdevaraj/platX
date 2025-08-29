const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllTestConfigurations } = require('../controllers/testConfiguration.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllTestConfigurations', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'test-configuration/all',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const configs = await getAllTestConfigurations();
      return { status: 200, jsonBody: { count: configs.length, configs } };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
