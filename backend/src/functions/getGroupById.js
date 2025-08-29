const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getGroupById } = require('../controllers/group.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getGroupById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'group/{id}',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();
      const { id } = request.params;
      const result = await getGroupById(id);
      return { status: 200, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  }
});
