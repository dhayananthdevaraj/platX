// functions/testVisibilityBulkSave.js
const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const testVisibilityController = require('../controllers/testVisibility.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('testVisibilityBulkSave', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'test-visibility/bulk-save',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);
      const body = await request.json();

      // normalize: accept visibilities[] or items[]
      body.items = body.items || body.visibilities || [];
      body.userId = body.userId || user.userId;

      console.log("[testVisibilityBulkSave] payload count:", body.items.length);

      const res = await testVisibilityController.saveTestVisibilitiesBulk(body);
      return { status: 200, jsonBody: res };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { message: err.message || 'Something went wrong' },
      };
    }
  },
});