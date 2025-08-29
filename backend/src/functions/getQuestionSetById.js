const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getQuestionSetById } = require('../controllers/questionSet.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getQuestionSetById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'questionset/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const id = request.params.id;
      const questionSet = await getQuestionSetById(id);

      return { status: 200, jsonBody: questionSet };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
