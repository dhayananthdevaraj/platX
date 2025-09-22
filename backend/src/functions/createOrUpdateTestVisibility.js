const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createOrUpdateTestVisibility } = require('../controllers/testVisibility.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createOrUpdateTestVisibility', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'test-visibility/create-or-update',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const body = await request.json();
      body.createdBy = body.createdBy || user.userId;
      body.lastUpdatedBy = user.userId;

      const result = await createOrUpdateTestVisibility(body);

      return { status: 200, jsonBody: result };
    } catch (err) {
      context.error('Error createOrUpdate test visibility:', err);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' },
      };
    }
  },
});
