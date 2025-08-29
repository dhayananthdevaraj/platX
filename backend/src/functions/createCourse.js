const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createCourse } = require('../controllers/course.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createCourse', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'course/create',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const body = await request.json();
      body.createdBy = user.userId;
      body.lastUpdatedBy = user.userId;

      const result = await createCourse(body);
      return { status: 201, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
