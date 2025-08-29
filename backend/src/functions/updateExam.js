const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const { updateExam } = require('../controllers/exam.controller');

app.http('updateExam', {
  methods: ['PUT'],
  route: 'exam/{id}',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      await connectDB();
       const {id } = request.params;
      //  console.log(request.params);
       
      const updateData = await request.json();
      const result = await updateExam(id, updateData);

      return {
        status: 200,
        jsonBody: {
          message: 'Exam updated successfully',
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
