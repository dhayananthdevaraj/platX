const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseModuleSectionSchema = new Schema(
  {
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: "CourseModule",
      required: true,
    },
    sectionName: {
      type: String,
      required: true,
      trim: true,
    },
    sectionDescription: {
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

courseModuleSectionSchema.index({ moduleId: 1, sectionName: 1 }, { unique: true });
courseModuleSectionSchema.index({ moduleId: 1, order: 1 });

module.exports = mongoose.model("CourseModuleSection", courseModuleSectionSchema);
