const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createExam } = require('../controllers/exam.controller');

app.http('createExam', {
  methods: ['POST'],
  route: 'exam/create',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await connectDB();
      const data = await request.json();
      const result = await createExam(data);

      return {
        status: 201,
        jsonBody: result
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
