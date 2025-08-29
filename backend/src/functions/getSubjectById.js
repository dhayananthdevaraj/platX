const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getSubjectById } = require('../controllers/subject.controller');

app.http('getSubjectById', {
  methods: ['GET'],
  route: 'subject/{id}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await connectDB();
     const { id } = request.params;
      const subject = await getSubjectById(id);
      return {
        status: 200,
        jsonBody: subject
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
