const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createTestConfiguration } = require('../controllers/testConfiguration.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createTestConfiguration', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'test-configuration/create',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const body = await request.json();
      body.createdBy = user.userId;
      body.lastUpdatedBy = user.userId;

      const result = await createTestConfiguration(body);
      return { status: 201, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
