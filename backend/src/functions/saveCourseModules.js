// functions/saveCourseModules.js
const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { saveCourseModules } = require('../controllers/course.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('saveCourseModules', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'course/save-modules',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const body = await request.json();
      body.userId = user.userId; // inject user into payload

      const result = await saveCourseModules(body);

      return { status: 200, jsonBody: result };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' },
      };
    }
  },
});
