const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getTestVisibilityByCourseAndTest } = require('../controllers/testVisibility.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getTestVisibilityByCourseAndTest', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'test-visibility/{courseId}/{testId}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const { courseId, testId } = request.params;

      const visibility = await getTestVisibilityByCourseAndTest(courseId, testId);

      return { status: 200, jsonBody: visibility };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
