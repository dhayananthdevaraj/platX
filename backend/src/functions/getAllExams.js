const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllExams } = require('../controllers/exam.controller');

app.http('getAllExams', {
  methods: ['GET'],
  route: 'exam/all',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await connectDB();
      const exams = await getAllExams();

      return {
        status: 200,
        jsonBody: { count: exams.length, exams }
      };
    } catch (err) {
      return {
        status: 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
