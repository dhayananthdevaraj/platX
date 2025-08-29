const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllEnrollments } = require('../controllers/enrollment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllEnrollments', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'enrollment/all',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const enrollments = await getAllEnrollments();
      return { status: 200, jsonBody: { count: enrollments.length, enrollments } };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
