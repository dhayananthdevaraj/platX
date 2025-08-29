const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { updateGroup } = require('../controllers/group.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('updateGroup', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'group/{id}',
  handler: async (request, context) => {
    try {
      const user = verifyToken(request);
      await connectDB();
      const { id } = request.params;
      const body = await request.json();
      const result = await updateGroup(id, { ...body, lastUpdatedBy: user.userId });
      return { status: 200, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  }
});
