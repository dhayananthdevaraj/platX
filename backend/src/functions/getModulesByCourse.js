const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getModulesByCourse } = require('../controllers/courseModule.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getModulesByCourse', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'module/course/{courseId}',
  handler: async (request, context) => {
    try {
      await connectDB();
      // verifyToken(request);

      const { courseId } = request.params;
      const modules = await getModulesByCourse(courseId);

      return { status: 200, jsonBody: { count: modules.length, modules } };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
