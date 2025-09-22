const { app } = require('@azure/functions');
const Busboy = require('busboy');
const connectDB = require('../utils/db');
const { verifyToken } = require('../middleware/auth.middleware');
const { updateQuestion } = require('../controllers/question.controller');

app.http('updateQuestion', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'question/update/{id}',
  handler: async (req, context) => {
    try {
      await connectDB();

      // 🔑 Optional auth
      const user = verifyToken(req);

      const headers = Object.fromEntries(req.headers);
      const busboy = Busboy({ headers });

      const fields = {};
      const files = [];

      const fileParsePromise = new Promise((resolve, reject) => {
        busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
          const chunks = [];
          file.on('data', (chunk) => chunks.push(chunk));
          file.on('end', () => {
            files.push({
              fieldname,
              filename,
              mimetype: mimeType,
              buffer: Buffer.concat(chunks),
            });
          });
        });

        busboy.on('field', (fieldname, value) => {
          // ✅ Support multiple values (like arrays)
          if (fields[fieldname]) {
            if (!Array.isArray(fields[fieldname])) {
              fields[fieldname] = [fields[fieldname]];
            }
            fields[fieldname].push(value);
          } else {
            fields[fieldname] = value;
          }
        });

        busboy.on('finish', resolve);
        busboy.on('error', reject);
      });

      // Feed Busboy with raw request body
      const buffer = Buffer.from(await req.arrayBuffer());
      busboy.end(buffer);

      await fileParsePromise;

      // Add metadata
      if (user && user.userId) {
        fields.lastUpdatedBy = user.userId;
      }

      const id = req.params.id;

      // ✅ Ensure existingImages is JSON (if sent as string from frontend)
      if (fields.existingImages && typeof fields.existingImages === "string") {
        try {
          fields.existingImages = JSON.parse(fields.existingImages);
        } catch {
          // leave as raw string if parsing fails
        }
      }

      const result = await updateQuestion(id, fields, files);

      return {
        status: 200,
        jsonBody: result,
      };
    } catch (err) {
      context.log('Update error:', err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Failed to update question' },
      };
    }
  },
});