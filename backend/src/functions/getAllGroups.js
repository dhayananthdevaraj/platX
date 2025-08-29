const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getAllGroups } = require('../controllers/group.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getAllGroups', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'group/all',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();
      const result = await getAllGroups();
      return { status: 200, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  }
});
