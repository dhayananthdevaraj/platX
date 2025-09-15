// api/getTestResultsByCourseAndTest.js
const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { getResultsByCourseAndTest } = require('../controllers/testResult.controller');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('getTestResultsByCourseAndTest', {
    methods: ['GET'],
    authLevel: 'anonymous', // or 'function' if you want to secure
    route: 'testresults/course/{courseId}/test/{testId}',
    handler: async (request, context) => {
        try {
            // ✅ Connect to DB
            await connectDB();

            // ✅ Optional auth
            verifyToken(request);

            // ✅ Get params
            const { courseId, testId } = request.params;

            // ✅ Call controller
            const results = await getResultsByCourseAndTest(courseId, testId);

            return {
                status: 200,
                jsonBody: results
            };
        } catch (err) {
            return {
                status: err.status || 500,
                jsonBody: { error: err.message || 'Internal Server Error' }
            };
        }
    }
});
