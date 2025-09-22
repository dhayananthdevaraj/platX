// functions/testConfigurationCreateOrUpdate.js
const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const testConfigController = require('../controllers/testConfiguration.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('testConfigurationCreateOrUpdate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'test-configuration/create-or-update',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);
      const body = await request.json();
      // ensure createdBy / lastUpdatedBy from token if missing
      body.createdBy = body.createdBy || user.userId;
      body.lastUpdatedBy = body.lastUpdatedBy || user.userId;

      const res = await testConfigController.createOrUpdateTestConfiguration(body);
      return { status: 200, jsonBody: res };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { message: err.message || 'Something went wrong' },
      };
    }
  },
});
