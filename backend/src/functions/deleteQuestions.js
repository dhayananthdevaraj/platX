const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { deleteQuestions } = require("../controllers/question.controller");



app.http('deleteQuestions', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    route: 'questions/delete', // e.g. DELETE /api/questions
    handler: async (request, context) => {
        try {
            await connectDB();
            // verifyToken(request);

            const body = await request.json();
            const { ids } = body;

            if (!ids || (Array.isArray(ids) && ids.length === 0)) {
                return { status: 400, jsonBody: { error: 'ids required (string or array)' } };
            }

            const deleted = await deleteQuestions(ids);

            return { status: 200, jsonBody: deleted };
        } catch (err) {
            return { status: err.status || 500, jsonBody: { error: err.message } };
        }
    }
});
