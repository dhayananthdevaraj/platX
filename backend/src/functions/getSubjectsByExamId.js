const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getSubjectsByExamId } = require('../controllers/subject.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getSubjectsByExamId', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'subject/exam/{examId}',
  handler: async (request, context) => {
    try {
      // verifyToken(request); // 🔒 Auth check
      await connectDB();

      const { examId } = request.params;

      const result = await getSubjectsByExamId(examId);

      // console.log("The result is",result);
      return {
        status: 200,
        jsonBody: result
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Internal Server Error' }
      };
    }
  }
});
