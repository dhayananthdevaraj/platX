const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { updateUser } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('updateUser', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'users/{id}',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();

      const userId = request.params.id;
      const updateData = await request.json();

      const result = await updateUser(userId, updateData);

      return {
        status: 200,
        jsonBody: {
          message: 'User updated successfully',
          data: result
        }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Update failed' }
      };
    }
  }
});
