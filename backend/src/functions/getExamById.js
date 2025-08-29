const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getExamById } = require('../controllers/exam.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getExamById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'exam/{examId}',
  handler: async (request, context) => {
    try {
      verifyToken(request); // ✅ Auth check
      await connectDB();

      const { examId } = request.params;

      const exam = await getExamById(examId);

      return {
        status: 200,
        jsonBody: exam
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Internal Server Error' }
      };
    }
  }
});
