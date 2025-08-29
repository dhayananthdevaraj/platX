const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getTestConfigurationById } = require('../controllers/testConfiguration.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getTestConfigurationById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'test-configuration/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      verifyToken(request);

      const id = context.request.params.id;
      const config = await getTestConfigurationById(id);

      return { status: 200, jsonBody: config };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
