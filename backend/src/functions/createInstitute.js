const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createInstitute } = require('../controllers/institute.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createInstitute', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'institute/create',
  handler: async (request, context) => {
    try {
      const user = verifyToken(request);
      // context.log('Authenticated user:', decodedUser);
      await connectDB();

      const body = await request.json(); // read JSON payload

      const result = await createInstitute({...body,createdBy: user.userId});

      return {
        status: 201,
        jsonBody: {
          message: 'Institute created successfully',
          data: result
        }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: {
          error: err.message || 'Something went wrong'
        }
      };
    }
  }
});
