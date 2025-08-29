const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getCourseById } = require('../controllers/course.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getCourseById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'course/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

       const { id } = request.params;
      const course = await getCourseById(id);

      return { status: 200, jsonBody: course };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
