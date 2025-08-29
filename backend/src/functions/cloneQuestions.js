const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { cloneQuestions } = require('../controllers/question.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('cloneQuestions', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'question/clone',
    handler: async (request, context) => {
        try {
            await connectDB();

            // const user = verifyToken(request);

            const body = await request.json();
            const { questionIds } = body;

            if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
                return {
                    status: 400,
                    jsonBody: { error: 'questionIds (array) are required' }
                };
            }

            // const createdBy = user.userId;
            const createdBy = body.createdBy || "system"; // fallback if no auth

            const result = await cloneQuestions(questionIds, createdBy);

            return { status: 201, jsonBody: result };
        } catch (err) {
            return {
                status: err.status || 500,
                jsonBody: { error: err.message || 'Something went wrong' }
            };
        }
    }
});
