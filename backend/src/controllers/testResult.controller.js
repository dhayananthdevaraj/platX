const TestResult = require('../models/testResult.model');
const Test = require('../models/test.model');
const Question = require('../models/question.model');
const TestConfiguration = require('../models/testConfiguration.model');

/**
 * ✅ Start a Test Attempt
 */
const startTestAttempt = async ({ courseId, testId, studentId, createdBy }) => {
  if (!courseId || !testId || !studentId) {
    const err = new Error('Missing required fields: courseId, testId, studentId');
    err.status = 400;
    throw err;
  }

  // ✅ Check for existing IN_PROGRESS attempt
  const existingAttempt = await TestResult.findOne({
    courseId,
    testId,
    studentId,
    status: "IN_PROGRESS",
  }).lean();

  if (existingAttempt) {
    return {
      message: "Resuming existing attempt",
      attemptId: existingAttempt._id,
      attemptNumber: existingAttempt.attemptNumber,
      resumed: true
    };
  }

  // ✅ Determine next attempt number
  const lastAttempt = await TestResult.findOne({ courseId, testId, studentId })
    .sort({ attemptNumber: -1 })
    .lean();

  const attemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1;

  // ✅ Create new attempt
  const newAttempt = new TestResult({
    courseId,
    testId,
    studentId,
    answers: [],
    sectionWiseMarks: [], // empty initially
    totalMarks: 0,
    obtainedMarks: 0,
    percentage: 0,
    status: "IN_PROGRESS",
    attemptNumber,
    createdBy,
    lastUpdatedBy: createdBy,
    startedAt: new Date(),
  });

  await newAttempt.save();

  return {
    message: "Test attempt started",
    attemptId: newAttempt._id,
    attemptNumber,
    resumed: false
  };
};

/**
 * ✅ Submit / Finalize Test Result (with section-wise marks)
 */
const submitTestResult = async ({ attemptId, studentId, answers, lastUpdatedBy, remarks }) => {
  if (!attemptId || !studentId || !Array.isArray(answers)) {
    const err = new Error("Missing required fields: attemptId, studentId, answers");
    err.status = 400;
    throw err;
  }

  const attempt = await TestResult.findById(attemptId);
  if (!attempt) {
    const err = new Error("Test attempt not found");
    err.status = 404;
    throw err;
  }

  if (attempt.status !== "IN_PROGRESS") {
    const err = new Error("Test already submitted");
    err.status = 400;
    throw err;
  }

  const test = await Test.findById(attempt.testId).lean();
  if (!test) {
    const err = new Error("Test not found");
    err.status = 404;
    throw err;
  }

  const config = await TestConfiguration.findOne({ testId: test._id }).lean();
  if (!config) {
    const err = new Error("Test configuration not found");
    err.status = 404;
    throw err;
  }

  const { correctMark, negativeMark, passPercentage } = config;

  // Get all questions
  const questionIds = test.sections?.flatMap(s => s.questions) || [];
  const questions = await Question.find({ _id: { $in: questionIds } }).lean();

  let obtainedMarks = 0;
  let totalMarks = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;

  // ✅ Evaluate Answers
  const evaluatedAnswers = answers.map(ans => {
    const q = questions.find(q => q._id.toString() === ans.questionId);
    if (!q) return null;

    if (ans.selectedOptionIndex === null || ans.selectedOptionIndex === undefined) {
      unattemptedCount++;
      totalMarks += correctMark;
      return {
        questionId: q._id,
        selectedOptionIndex: null,
        isCorrect: false,
        marksAwarded: 0,
      };
    }

    const isCorrect = q.correctAnswerIndex === ans.selectedOptionIndex;
    let marksAwarded = isCorrect ? correctMark : -(negativeMark || 0);

    if (isCorrect) correctCount++;
    else wrongCount++;

    obtainedMarks += marksAwarded;
    totalMarks += correctMark;

    return {
      questionId: q._id,
      selectedOptionIndex: ans.selectedOptionIndex,
      isCorrect,
      marksAwarded,
    };
  }).filter(Boolean);

  // ✅ Section-wise calculation
  const sectionWiseMarks = test.sections.map(section => {
    let sectionObtained = 0;
    let sectionTotal = 0;

    section.questions.forEach(qId => {
      const q = questions.find(q => q._id.toString() === qId.toString());
      if (!q) return;
      sectionTotal += correctMark;

      const ans = evaluatedAnswers.find(a => a.questionId.toString() === q._id.toString());
      if (ans) sectionObtained += ans.marksAwarded;
    });

    return {
      sectionId: section._id,
      sectionName: section.sectionName,
      obtainedMarks: sectionObtained,
      totalMarks: sectionTotal,
    };
  });

  const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;
  const status = percentage >= passPercentage ? "PASSED" : "FAILED";

  // ✅ Update Attempt
  attempt.answers = evaluatedAnswers;
  attempt.sectionWiseMarks = sectionWiseMarks;
  attempt.totalMarks = totalMarks;
  attempt.obtainedMarks = obtainedMarks;
  attempt.percentage = percentage;
  attempt.correctCount = correctCount;
  attempt.wrongCount = wrongCount;
  attempt.unattemptedCount = unattemptedCount;
  attempt.status = status;
  attempt.remarks = remarks;
  attempt.submittedAt = new Date();
  attempt.lastUpdatedBy = lastUpdatedBy;

  await attempt.save();

  return {
    message: "Test submitted successfully",
    attemptId: attempt._id,
    obtainedMarks,
    totalMarks,
    percentage,
    correctCount,
    wrongCount,
    unattemptedCount,
    status,
    sectionWiseMarks,
  };
};

/**
 * ✅ Other CRUD functions remain unchanged
 */
const getResultsByStudent = async (studentId) => {
  return await TestResult.find({ studentId })
    .populate('courseId', 'name')
    .populate('testId', 'name')
    .sort({ createdAt: -1 })
    .lean();
};

const getResultsByCourse = async (courseId) => {
  return await TestResult.find({ courseId })
    .populate('studentId', 'name email')
    .populate('testId', 'name')
    .sort({ createdAt: -1 })
    .lean();
};

const getResultById = async (resultId) => {
  const result = await TestResult.findById(resultId)
    .populate('courseId', 'name')
    .populate('testId', 'name')
    .populate('studentId', 'name email');

  if (!result) {
    const err = new Error('Test result not found');
    err.status = 404;
    throw err;
  }
  return result;
};

const updateTestResult = async (resultId, body) => {
  const updateData = { ...body, lastUpdatedBy: body.lastUpdatedBy || null };
  const updated = await TestResult.findByIdAndUpdate(resultId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    const err = new Error('Test result not found or update failed');
    err.status = 404;
    throw err;
  }
  return updated;
};

const deleteTestResult = async (resultId) => {
  const deleted = await TestResult.findByIdAndDelete(resultId);
  if (!deleted) {
    const err = new Error('Test result not found or delete failed');
    err.status = 404;
    throw err;
  }
  return { message: 'Test result deleted successfully', resultId };
};

const getTestHistory = async ({ studentId, testId, courseId }) => {
  if (!studentId || !testId || !courseId) {
    const err = new Error("Missing required fields: studentId, testId, courseId");
    err.status = 400;
    throw err;
  }

  const attempts = await TestResult.find({ studentId, testId, courseId })
    .populate("answers.questionId", "text options correctAnswerIndex")
    .sort({ attemptNumber: -1 });

  return {
    attempts: attempts.map(attempt => ({
      attemptId: attempt._id,
      attemptNumber: attempt.attemptNumber,
      totalMarks: attempt.totalMarks,
      obtainedMarks: attempt.obtainedMarks,
      percentage: attempt.percentage,
      status: attempt.status,
      remarks: attempt.remarks,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      answers: attempt.answers,
      sectionWiseMarks: attempt.sectionWiseMarks,
    })),
  };
};

// const getResultsByCourseAndTest = async (req, reply) => {
//   try {
//     const { courseId, testId } = req.query;

//     if (!courseId || !testId) {
//       return reply.code(400).send({ error: 'courseId and testId are required' });
//     }

//     const results = await TestResult.find({ courseId, testId })
//       .populate('studentId', 'name email') // bring student info
//       .populate('courseId', 'name') // bring course info
//       .populate('testId', 'name') // bring test info
//       .sort({ createdAt: -1 });

//     reply.send({
//       count: results.length,
//       results
//     });
//   } catch (err) {
//     reply.code(err.status || 500).send({ error: err.message });
//   }
// };

const getResultsByCourseAndTest = async (courseId, testId) => {
  if (!courseId || !testId) {
    const err = new Error('courseId and testId are required');
    err.status = 400;
    throw err;
  }

  const results = await TestResult.find({ courseId, testId })
    // .populate('studentId', 'name email')   // student info
    // .populate('courseId', 'name')          // course info
    .populate('testId', 'name code')            // test info
    .populate({
      path: 'answers.questionId',
      model: 'Question',
      select: '_id text options correctAnswerIndex'
    })
    .sort({ createdAt: -1 });

  return {
    count: results.length,
    results
  };
};


module.exports = {
  startTestAttempt,
  submitTestResult,
  getResultsByStudent,
  getResultsByCourse,
  getResultById,
  updateTestResult,
  deleteTestResult,
  getTestHistory,
  getResultsByCourseAndTest
};
