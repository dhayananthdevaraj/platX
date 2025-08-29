const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllQuestions } = require('../controllers/question.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllQuestions', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'question/all',
  handler: async (request, context) => {
    try {
      await connectDB();
      // verifyToken(request);

      const questions = await getAllQuestions();
      return { status: 200, jsonBody: { count: questions.length, questions } };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
