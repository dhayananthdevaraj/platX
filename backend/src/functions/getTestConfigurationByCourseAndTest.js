const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getTestConfigurationByCourseAndTest } = require('../controllers/testConfiguration.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// ✅ Get Test Configuration by CourseId + TestId
app.http('getTestConfigurationByCourseAndTest', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'test-configuration/{courseId}/{testId}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const { courseId, testId } = request.params;

      const config = await getTestConfigurationByCourseAndTest(courseId, testId);
      return { status: 200, jsonBody: config };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
