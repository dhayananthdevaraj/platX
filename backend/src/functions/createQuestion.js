const { app } = require('@azure/functions');
const Busboy = require('busboy');
const fs = require('fs');
const os = require('os');
const path = require('path');
const connectDB = require('../utils/db');
const { verifyToken } = require('../middleware/auth.middleware');
const { createQuestion } = require('../controllers/question.controller');

app.http('createQuestion', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'question/create',
  handler: async (req, context) => {
    try {
      await connectDB();

      // 🔑 If auth needed
      // const user = verifyToken(req);

      const headers = Object.fromEntries(req.headers);
      const busboy = Busboy({ headers });

      const fields = {};
      const files = [];

      const fileWritePromises = [];

      const fileParsePromise = new Promise((resolve, reject) => {


        //         busboy.on('file', (fieldname, file, info) => {
        //   const chunks = [];

        //   file.on('data', (chunk) => chunks.push(chunk));

        //   file.on('end', () => {
        //     files.push({
        //       fieldname,
        //       filename: info.filename,
        //       mimetype: info.mimeType,
        //       buffer: Buffer.concat(chunks)   // 👈 store buffer directly
        //     });
        //   });
        // });
        busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
          const chunks = [];

          file.on('data', (chunk) => chunks.push(chunk));
          console.log("filename", filename, fieldname)
          file.on('end', () => {
            files.push({
              fieldname,
              filename,       // ✅ original filename
              mimetype: mimeType, // ✅ correct mime type
              buffer: Buffer.concat(chunks)
            });
          });
        });


        busboy.on('field', (fieldname, value) => {
          fields[fieldname] = value;
        });

        busboy.on('finish', resolve);
        busboy.on('error', reject);
      });

      // Feed Busboy with raw buffer
      const buffer = Buffer.from(await req.arrayBuffer());
      busboy.end(buffer);

      await fileParsePromise;
      await Promise.all(fileWritePromises);

      // Add user info if needed
      // fields.createdBy = user.userId;
      // fields.lastUpdatedBy = user.userId;

      // Call controller

      console.log("fields", fields)
      const result = await createQuestion(fields, files);

      // Clean temp files
      files.forEach((f) => {
        if (f.path) fs.unlinkSync(f.path);
      });

      return {
        status: 201,
        jsonBody: result
      };
    } catch (err) {
      context.log('Upload error:', err.message);
      return {
        status: err.status || 500,
        jsonBody: { error: err.message || 'Failed to create question' }
      };
    }
  }
});