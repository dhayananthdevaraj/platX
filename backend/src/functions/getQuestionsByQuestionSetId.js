const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { verifyToken } = require('../middleware/auth.middleware');
const { getQuestionsByQuestionSetId } = require('../controllers/question.controller');

// Edge Function: Get Questions by QuestionSetId
app.http('getQuestionsByQuestionSetId', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'question/questionset/{questionSetId}',
    handler: async (request, context) => {
        try {
            await connectDB();
            verifyToken(request);

            const { questionSetId } = request.params;

            const questions = await getQuestionsByQuestionSetId(questionSetId);

            return { status: 200, jsonBody: questions };
        } catch (err) {
            return { status: err.status || 500, jsonBody: { error: err.message || 'Something went wrong' } };
        }
    }
});