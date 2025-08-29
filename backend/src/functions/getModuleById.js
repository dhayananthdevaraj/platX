const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getModuleById } = require('../controllers/courseModule.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getModuleById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'module/{moduleId}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const { moduleId } = request.params;
      const module = await getModuleById(moduleId);

      return { status: 200, jsonBody: module };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
