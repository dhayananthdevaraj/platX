const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createUser } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createUser', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
     const decodedUser = verifyToken(request);
      context.log('Authenticated user:', decodedUser);

      await connectDB();

      const body = await request.json(); // get JSON payload

      const result = await createUser(body);

      return {
        status: 201,
        jsonBody: {
          message: 'User created successfully',
          data: result
        }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
