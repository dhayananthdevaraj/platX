const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseModuleSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    moduleName: {
      type: String,
      required: true,
      trim: true,
    },
    moduleDescription: {
      type: String,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Ensure unique module name per course
courseModuleSchema.index({ courseId: 1, moduleName: 1 }, { unique: true });
courseModuleSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model("CourseModule", courseModuleSchema);
