const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getQuestionById } = require('../controllers/question.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getQuestionById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'question/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const id = request.params.id;
      const question = await getQuestionById(id);

      return { status: 200, jsonBody: question };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
