const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createTestVisibility } = require('../controllers/testVisibility.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createTestVisibility', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'test-visibility/create',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const body = await request.json();
      body.createdBy = user.userId;
      body.lastUpdatedBy = user.userId;

      const result = await createTestVisibility(body);
      return { status: 201, jsonBody: result };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
