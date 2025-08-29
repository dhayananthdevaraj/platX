const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { deleteModule } = require('../controllers/courseModule.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('deleteModule', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'module/delete/{moduleId}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const { moduleId } = request.params;
      const deleted = await deleteModule(moduleId);

      return { status: 200, jsonBody: deleted };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
