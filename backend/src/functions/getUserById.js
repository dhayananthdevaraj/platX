const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getUserById } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getUserById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users/{id}',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();

      const userId = request.params.id;
      const result = await getUserById(userId);

      return {
        status: 200,
        jsonBody: result
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'User not found' }
      };
    }
  }
});
