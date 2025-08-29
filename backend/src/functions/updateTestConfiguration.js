const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { updateTestConfiguration } = require('../controllers/testConfiguration.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('updateTestConfiguration', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'test-configuration/update/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);

       const {id } = request.params;
      const body = await request.json();
      body.lastUpdatedBy = user.userId;

      const updated = await updateTestConfiguration(id, body);
      return { status: 200, jsonBody: updated };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
