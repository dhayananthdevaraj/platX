const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getEnrollmentById } = require('../controllers/enrollment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getEnrollmentById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'enrollment/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const id = context.request.params.id;
      const enrollment = await getEnrollmentById(id);

      return { status: 200, jsonBody: enrollment };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
