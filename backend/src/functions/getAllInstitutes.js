const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllInstitutes } = require('../controllers/institute.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllInstitutes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'institutes',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();

      const institutes = await getAllInstitutes();

      return {
        status: 200,
        jsonBody: {
          count: institutes.length,
          institutes
        }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Failed to retrieve institutes' }
      };
    }
  }
});
