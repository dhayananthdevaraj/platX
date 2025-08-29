const { app } = require('@azure/functions');
const { forgotPassword } = require('../controllers/user.controller');
const connectDB = require('../utils/db');

app.http('forgotPassword', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await connectDB();
      const { email } = await request.json();

      const response = await forgotPassword(email);

      return {
        status: 200,
        jsonBody: response
      };
    } catch (err) {
    //   context.log.error('Forgot password error:', err);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Internal server error' }
      };
    }
  }
});
