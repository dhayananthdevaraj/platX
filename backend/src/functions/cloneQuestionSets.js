const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { cloneQuestionSets } = require('../controllers/questionSet.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('cloneQuestionSets', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'questionset/clone',
    handler: async (request, context) => {
        try {
            await connectDB();

            const body = await request.json();
            const { questionSetIds, name, code } = body;

            if (!questionSetIds || !Array.isArray(questionSetIds) || questionSetIds.length === 0) {
                return { status: 400, jsonBody: { error: 'questionSetIds (array) are required' } };
            }

            const createdBy = body.createdBy || "system";

            const result = await cloneQuestionSets(questionSetIds, createdBy, name, code);

            return { status: 201, jsonBody: result };
        } catch (err) {
            return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
        }
    }
});