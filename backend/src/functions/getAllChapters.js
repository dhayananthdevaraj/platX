const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllChapters } = require('../controllers/chapter.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllChapters', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'chapter/all',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const chapters = await getAllChapters();
      return {
        status: 200,
        jsonBody: { count: chapters.length, chapters }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
