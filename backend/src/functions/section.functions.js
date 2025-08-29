const { app } = require('@azure/functions');
const connectDB = require('../utils/db');
const {
  createSection,
  getSectionsByModule,
  getSectionById,
  updateSection,
  deleteSection,
  reorderSections,
} = require('../controllers/courseModuleSection.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// ✅ Create Section
app.http('createSection', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'section/create',
  handler: async (request) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const body = await request.json();
      body.createdBy = user.userId;
      body.lastUpdatedBy = user.userId;

      const result = await createSection(body);

      return { status: 201, jsonBody: result };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});

// ✅ Get Sections by Module
app.http('getSectionsByModule', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'section/module/{moduleId}',
  handler: async (request) => {
    try {
      await connectDB();
      verifyToken(request);

      const { moduleId } = request.params;
      const sections = await getSectionsByModule(moduleId);

      return { status: 200, jsonBody: sections };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});

// ✅ Get Section by ID
app.http('getSectionById', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'section/{sectionId}',
  handler: async (request) => {
    try {
      await connectDB();
      verifyToken(request);

      const { sectionId } = request.params;
      const section = await getSectionById(sectionId);

      return { status: 200, jsonBody: section };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});

// ✅ Update Section
app.http('updateSection', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'section/update/{sectionId}',
  handler: async (request) => {
    try {
      await connectDB();
      const user = verifyToken(request);

      const { sectionId } = request.params;
      const body = await request.json();
      body.lastUpdatedBy = user.userId;

      const updated = await updateSection(sectionId, body);

      return { status: 200, jsonBody: updated };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});

// ✅ Delete Section
app.http('deleteSection', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'section/delete/{sectionId}',
  handler: async (request) => {
    try {
      await connectDB();
      verifyToken(request);

      const { sectionId } = request.params;
      const deleted = await deleteSection(sectionId);

      return { status: 200, jsonBody: deleted };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});

// ✅ Reorder Sections
app.http('reorderSections', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'section/reorder/{moduleId}',
  handler: async (request) => {
    try {
      await connectDB();
      verifyToken(request);

      const { moduleId } = request.params;
      const body = await request.json();

      const reordered = await reorderSections(moduleId, body);

      return { status: 200, jsonBody: reordered };
    } catch (err) {
      return { status: err.status || 500, jsonBody: { error: err.message } };
    }
  },
});
