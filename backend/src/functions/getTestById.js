const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getTestById } = require('../controllers/test.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getTestById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'test/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

       const { id } = request.params;

      const test = await getTestById(id);

      return { status: 200, jsonBody: test };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
