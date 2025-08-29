const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllQuestionSets } = require('../controllers/questionSet.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllQuestionSets', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'questionset/all',
  handler: async (request, context) => {
    try {
      await connectDB();
      // verifyToken(request);

      const sets = await getAllQuestionSets();
      return { status: 200, jsonBody: { count: sets.length, questionSets: sets } };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
