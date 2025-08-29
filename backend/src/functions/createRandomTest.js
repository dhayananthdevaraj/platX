const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const RandomTest = require('../models/randomTest.model');
const { verifyToken } = require('../middleware/auth.middleware');

app.http('createRandomTest', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'randomtest/create',
  handler: async (request, context) => {
    try {
      // DB connection
      await connectDB();

      // verify user
      const user = verifyToken(request);
      if (!user || !user.userId) {
        return { status: 401, jsonBody: { error: 'Unauthorized' } };
      }

      // request body
      const body = await request.json();

      // attach audit fields
      body.createdBy = user.userId;
      body.lastUpdatedBy = user.userId;

      // Create and save RandomTest
      const randomTest = new RandomTest(body);
      const savedTest = await randomTest.save();

      return {
        status: 201,
        jsonBody: {
          message: 'Random Test created successfully',
          test: savedTest,
        },
      };
    } catch (err) {
      context.log('Error creating random test:', err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Something went wrong' },
      };
    }
  },
});
