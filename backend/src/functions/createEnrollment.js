const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createEnrollment } = require('../controllers/enrollment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createEnrollment', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'enrollment/create',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const body = await request.json();
      body.createdBy = user.userId;
      body.lastUpdatedBy = user.userId;

      const result = await createEnrollment(body);
      return { status: 201, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
