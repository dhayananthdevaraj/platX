const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getRandomTestById } = require('../controllers/randomTest.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getRandomTestById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'randomTest/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const { id } = request.params;

      const randomTest = await getRandomTestById(id);

      return { status: 200, jsonBody: randomTest };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
