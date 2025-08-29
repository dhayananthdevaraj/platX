const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { updateSubject } = require('../controllers/subject.controller');

app.http('updateSubject', {
  methods: ['PUT'],
  route: 'subject/{id}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await connectDB();
       const {id } = request.params;

      const updateData = await request.json();
      const result = await updateSubject(id, updateData);
      return {
        status: 200,
        jsonBody: {
          message: 'Subject updated successfully',
          data: result
        }
      };
    } catch (err) {
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' }
      };
    }
  }
});
