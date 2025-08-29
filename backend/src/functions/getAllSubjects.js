const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllSubjects } = require('../controllers/subject.controller');

app.http('getAllSubjects', {
  methods: ['GET'],
  route: 'subject/all',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await connectDB();
      const subjects = await getAllSubjects();
      return {
        status: 200,
        jsonBody: { count: subjects.length, subjects }
      };
    } catch (err) {
      return {
        status: 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
