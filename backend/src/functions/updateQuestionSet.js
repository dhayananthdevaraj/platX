const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { updateQuestionSet } = require('../controllers/questionSet.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('updateQuestionSet', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'questionset/update/{id}',
  handler: async (request, context) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const id = request.params.id;
      const body = await request.json();
      body.lastUpdatedBy = user.userId;

      const updated = await updateQuestionSet(id, body);

      return { status: 200, jsonBody: updated };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
    }
  }
});
