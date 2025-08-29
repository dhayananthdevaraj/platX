const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllUsers } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllUsers', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'users',
  handler: async (request, context) => {
    try {
    //   verifyToken(request);
      await connectDB();

      const role = request.query.get('role'); // optional filter
      const result = await getAllUsers({ role });

      return {
        status: 200,
        jsonBody: result
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Failed to fetch users' }
      };
    }
  }
});
