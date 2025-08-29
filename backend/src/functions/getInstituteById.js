const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getInstituteById } = require('../controllers/institute.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getInstituteById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'institutes/{id}',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();

      const instituteId = request.params.id;
      const result = await getInstituteById(instituteId);

      return {
        status: 200,
        jsonBody: result
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Institute not found' }
      };
    }
  }
});
