const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getTestVisibilityById } = require('../controllers/testVisibility.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getTestVisibilityById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'test-visibility/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const id = context.request.params.id;
      const visibility = await getTestVisibilityById(id);

      return { status: 200, jsonBody: visibility };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
