// functions/testConfigurationBulkSave.js
const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const testConfigController = require('../controllers/testConfiguration.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('testConfigurationBulkSave', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'test-configuration/bulk-save',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);
      const body = await request.json();

      // normalize: accept configs[] or items[]
      body.items = body.items || body.configs || [];
      body.userId = body.userId || user.userId;

      console.log("[testConfigurationBulkSave] payload count:", body.items.length);

      const res = await testConfigController.saveTestConfigurationsBulk(body);
      return { status: 200, jsonBody: res };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { message: err.message || 'Something went wrong' },
      };
    }
  },
});
