const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllCourses } = require('../controllers/course.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllCourses', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'course/all',
  handler: async (request, context) => {
    try {
      await connectDB();
      // verifyToken(request);

      const courses = await getAllCourses();
      return { status: 200, jsonBody: { count: courses.length, courses } };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
