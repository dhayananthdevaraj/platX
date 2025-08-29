const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createQuestionSet } = require('../controllers/questionSet.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createQuestionSet', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'questionset/create',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);
      const body = await request.json();

      if (user && user.userId) {
        body.createdBy = user.userId;
        body.lastUpdatedBy = user.userId;
      } else if (body.createdBy) {
        // fallback: if frontend explicitly sends createdBy
        body.lastUpdatedBy = body.createdBy;
      }

      const result = await createQuestionSet(body);
      return { status: 201, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
