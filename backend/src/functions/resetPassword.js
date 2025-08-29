const { app } = require('@azure/functions');
const { resetPassword } = require('../controllers/user.controller');
const connectDB = require('../utils/db');

app.http('resetPassword', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await connectDB();

      const { token, password } = await request.json();

      const result = await resetPassword(token, password);

      return {
        status: 200,
        jsonBody: result
      };
    } catch (err) {
      context.log.error('Reset password error:', err);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Internal server error' }
      };
    }
  }
});
