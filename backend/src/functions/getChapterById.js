const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getChapterById } = require('../controllers/chapter.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getChapterById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'chapter/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);
       const { id } = request.params;
      const chapter = await getChapterById(id);

      return {
        status: 200,
        jsonBody: chapter
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
