// 📂 functions/sectionTest.functions.js
const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const {
  addTestToSection,
  getTestsBySection,
  updateSectionTest,
  deleteSectionTest,
  reorderSectionTests,
} = require('../controllers/courseModuleSectionTest.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// ✅ Add Test to Section
app.http('addTestToSection', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'section-test/add',
  handler: async (request) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const body = await request.json();
      body.createdBy = user.userId;
      body.lastUpdatedBy = user.userId;

      const result = await addTestToSection(body);

      return { status: 201, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});

// ✅ Get Tests by Section
app.http('getTestsBySection', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'section-test/{sectionId}',
  handler: async (request) => {
    try {
      await connectDB();
      verifyToken(request);

      const { sectionId } = request.params;
      const tests = await getTestsBySection(sectionId);

      return { status: 200, jsonBody: tests };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});

// ✅ Update Section Test
app.http('updateSectionTest', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'section-test/update/{sectionTestId}',
  handler: async (request) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const { sectionTestId } = request.params;
      const body = await request.json();
      body.lastUpdatedBy = user.userId;

      const updated = await updateSectionTest(sectionTestId, body);

      return { status: 200, jsonBody: updated };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});

// ✅ Delete Section Test
app.http('deleteSectionTest', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'section-test/delete/{sectionTestId}',
  handler: async (request) => {
    try {
      await connectDB();
      verifyToken(request);

      const { sectionTestId } = request.params;
      const deleted = await deleteSectionTest(sectionTestId);

      return { status: 200, jsonBody: deleted };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});

// ✅ Reorder Section Tests (drag & drop)
app.http('reorderSectionTests', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'section-test/reorder/{sectionId}',
  handler: async (request) => {
    try {
      await connectDB();
      verifyToken(request);

      const { sectionId } = request.params;
      const body = await request.json();

      const reordered = await reorderSectionTests(sectionId, body);

      return { status: 200, jsonBody: reordered };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});
