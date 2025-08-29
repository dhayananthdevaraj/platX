const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { updateInstitute } = require('../controllers/institute.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('updateInstitute', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'institutes/{id}',
  handler: async (request, context) => {
    try {
      verifyToken(request);
      await connectDB();

      const instituteId = request.params.id;
      const updateData = await request.json();

      const result = await updateInstitute(instituteId, updateData);

      return {
        status: 200,
        jsonBody: {
          message: 'Institute updated successfully',
          data: result
        }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Institute update failed' }
      };
    }
  }
});
