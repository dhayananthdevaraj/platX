  const { app } = require('@azure/functions');
  const connectDB = require('../utils/db');
  const { getEnrollmentsByCourseId } = require('../controllers/enrollment.controller');
  const { verifyToken } = require('../middleware/auth.middleware');

  app.http('getEnrollmentsByCourseId', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'enrollments/course/{courseId}',
    handler: async (request, context) => {
      try {
        await connectDB();
        verifyToken(request);

        const { courseId } = request.params;
        const enrollments = await getEnrollmentsByCourseId(courseId);

        return { status: 200, jsonBody: enrollments };
      } catch (err) {
        return {
          status: err.status || 500,
          jsonBody: { error: err.message || 'Something went wrong' }
        };
      }
    }
  });
