const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { createGroup } = require('../controllers/group.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createGroup', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'group/create',
  handler: async (request, context) => {
    try {
      const user = verifyToken(request);
      await connectDB();
      const body = await request.json();
      const result = await createGroup({ ...body, createdBy: user.userId });
      return { status: 201, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  }
});
