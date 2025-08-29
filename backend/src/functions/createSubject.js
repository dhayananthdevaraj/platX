const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createSubject } = require('../controllers/subject.controller');

app.http('createSubject', {
  methods: ['POST'],
  route: 'subject/create',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await connectDB();
      const body = await request.json();
      const result = await createSubject(body);
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
