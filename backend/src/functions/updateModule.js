const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { updateModule } = require('../controllers/courseModule.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('updateModule', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'module/update/{moduleId}',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const { moduleId } = request.params;
      const body = await request.json();
      body.lastUpdatedBy = user.userId;

      const updated = await updateModule(moduleId, body);
      return { status: 200, jsonBody: updated };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
