const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseModuleSectionTestSchema = new Schema(
  {
    sectionId: {
      type: Schema.Types.ObjectId,
      ref: "CourseModuleSection",
      required: true,
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    configurationId: {
      type: Schema.Types.ObjectId,
      ref: "TestConfiguration",
    },
    visibilityId: {
      type: Schema.Types.ObjectId,
      ref: "TestVisibility",
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

courseModuleSectionTestSchema.index({ sectionId: 1, testId: 1 }, { unique: true });
courseModuleSectionTestSchema.index({ sectionId: 1, order: 1 });

module.exports = mongoose.model("CourseModuleSectionTest", courseModuleSectionTestSchema);
