const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { moveQuestions } = require('../controllers/question.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('moveQuestion', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'question/move',
    handler: async (request, context) => {
        try {
            await connectDB();

            // ✅ Uncomment if auth is enabled
            // const user = verifyToken(request);

            const body = await request.json();

            // Optionally track who moved them:
            // body.lastUpdatedBy = user.userId;

            const result = await moveQuestions(body);

            return { status: 200, jsonBody: result };
        } catch (err) {
            return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
        }
    }
});
