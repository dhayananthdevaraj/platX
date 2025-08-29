const { app } = require('@azure/functions');
const Busboy = require('busboy');
const fs = require('fs');
const os = require('os');
const path = require('path');
const connectDB = require('../utils/db');
const { verifyToken } = require('../middleware/auth.middleware');
const { importQuestionsFromExcel } = require('../controllers/question.controller');

app.http('importQuestions', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (req, context) => {
    try {
      await connectDB();
      const user = verifyToken(req);
      context.log('Authenticated user:', user);

      const headers = Object.fromEntries(req.headers);
      const busboy = Busboy({ headers });

      const fields = {};
      let tempFilePath = '';
      let originalFileName = '';

      const fileWritePromise = new Promise((resolve, reject) => {
        busboy.on('file', (fieldname, file, info) => {
          originalFileName = info.filename;
          tempFilePath = path.join(os.tmpdir(), originalFileName);
          const writeStream = fs.createWriteStream(tempFilePath);
          file.pipe(writeStream);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        busboy.on('field', (fieldname, value) => {
          fields[fieldname] = value;
        });

        busboy.on('error', reject);
      });

      const buffer = Buffer.from(await req.arrayBuffer());
      busboy.end(buffer);
      await fileWritePromise;

      const result = await importQuestionsFromExcel(
        { path: tempFilePath },
        {
          questionSetId: fields.questionSetId,
          createdBy: user.userId
        }
      );

      fs.unlinkSync(tempFilePath);

      return {
        status: 200,
        jsonBody: result
      };
    } catch (err) {
      context.log('Upload error:', err.message);
      return {
        status: 400,
        jsonBody: { error: err.message || 'Failed to import questions' }
      };
    }
  }
});
