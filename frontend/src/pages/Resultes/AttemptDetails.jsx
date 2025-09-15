import React from "react";
import { ChevronLeft, AlertTriangle } from "lucide-react";

const AttemptDetails = ({
    selectedAttempt,
    onBack,
    filters,
    setFilters,
    formatDate,
    getQuestionById
}) => {
    const filterQuestions = (answers) => {
        if (!answers) return [];

        return answers.filter(answer => {
            if (filters.questionFilter === 'all') return true;

            if (filters.questionFilter === 'correct' && !answer.isCorrect) return false;
            if (filters.questionFilter === 'incorrect' && (answer.isCorrect || answer.selectedOptionIndex === null)) return false;
            if (filters.questionFilter === 'unanswered' && answer.selectedOptionIndex !== null) return false;

            return true;
        });
    };

    const filteredAnswers = filterQuestions(selectedAttempt.answers);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <button
                                onClick={onBack}
                                className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Question Analysis - Attempt #{selectedAttempt.attemptNumber}
                            </h1>
                        </div>

                        {/* Question Filters */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={filters.questionFilter}
                                onChange={(e) => setFilters({ ...filters, questionFilter: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Questions ({selectedAttempt.answers?.length || 0})</option>
                                <option value="correct">
                                    Correct ({selectedAttempt.answers?.filter(a => a.isCorrect).length || 0})
                                </option>
                                <option value="incorrect">
                                    Incorrect ({selectedAttempt.answers?.filter(a => !a.isCorrect && a.selectedOptionIndex !== null).length || 0})
                                </option>
                                <option value="unanswered">
                                    Unanswered ({selectedAttempt.answers?.filter(a => a.selectedOptionIndex === null).length || 0})
                                </option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Attempt Summary */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {selectedAttempt.obtainedMarks}/{selectedAttempt.totalMarks}
                            </div>
                            <p className="text-sm text-gray-600">Score</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {selectedAttempt.percentage}%
                            </div>
                            <p className="text-sm text-gray-600">Percentage</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                #{selectedAttempt.attemptNumber}
                            </div>
                            <p className="text-sm text-gray-600">Attempt</p>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-bold text-gray-600">
                                {formatDate(selectedAttempt.startedAt)}
                            </div>
                            <p className="text-sm text-gray-600">Started</p>
                        </div>
                        <div className="text-center">
                            <div className="text-sm font-bold text-gray-600">
                                {selectedAttempt.submittedAt ? formatDate(selectedAttempt.submittedAt) : 'Not submitted'}
                            </div>
                            <p className="text-sm text-gray-600">Submitted</p>
                        </div>
                    </div>
                </div>

                {/* Section-wise marks */}
                {selectedAttempt.sectionWiseMarks && selectedAttempt.sectionWiseMarks.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h4 className="font-medium text-gray-900 mb-3">Section-wise Performance</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {selectedAttempt.sectionWiseMarks.map((section, index) => (
                                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                    <p className="font-medium text-gray-800">{section.sectionName}</p>
                                    <p className="text-sm text-gray-600">
                                        {section.obtainedMarks}/{section.totalMarks} marks
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {((section.obtainedMarks / section.totalMarks) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filtered Questions */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900">Question-wise Analysis</h4>
                        <p className="text-sm text-gray-600">
                            Showing {filteredAnswers.length} of {selectedAttempt.answers?.length || 0} questions
                        </p>
                    </div>

                    {filteredAnswers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No questions match the selected filter.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAnswers.map((answer, index) => {
                                const question = getQuestionById(answer.questionId._id, selectedAttempt.answers);
                                const originalIndex = selectedAttempt.answers.findIndex(a => a._id === answer._id);

                                if (!question) {
                                    return (
                                        <div key={answer._id} className="bg-red-50 p-4 rounded-lg border border-red-200">
                                            <p className="text-red-600">Question data not found for ID: {answer.questionId._id}</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={answer._id} className="bg-gray-50 p-4 rounded-lg border">
                                        <h5 className="font-medium text-gray-900 mb-3">
                                            Q{originalIndex + 1}: {question.text}
                                        </h5>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <p className="font-medium text-gray-700">Options:</p>
                                                {question.options.map((option, optionIndex) => {
                                                    let optionClass = "p-2 rounded border bg-white border-gray-200";

                                                    if (question.correctAnswerIndex === optionIndex) {
                                                        optionClass = "p-2 rounded border bg-green-50 border-green-200";
                                                    }

                                                    if (answer.selectedOptionIndex === optionIndex) {
                                                        if (answer.isCorrect) {
                                                            optionClass = "p-2 rounded border bg-green-100 border-green-300 font-medium";
                                                        } else {
                                                            optionClass = "p-2 rounded border bg-red-100 border-red-300 font-medium";
                                                        }
                                                    }

                                                    return (
                                                        <div key={optionIndex} className={optionClass}>
                                                            <span className="font-medium">
                                                                {String.fromCharCode(65 + optionIndex)}.
                                                            </span> {option}
                                                            {question.correctAnswerIndex === optionIndex && (
                                                                <span className="ml-2 text-green-600 text-sm">✓ Correct</span>
                                                            )}
                                                            {answer.selectedOptionIndex === optionIndex && (
                                                                <span className="ml-2 text-blue-600 text-sm">← Selected</span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="space-y-3">
                                                <div className="bg-white p-3 rounded border">
                                                    <p className="text-sm text-gray-600">Student Answer:</p>
                                                    <p className="font-medium">
                                                        {answer.selectedOptionIndex !== null
                                                            ? `${String.fromCharCode(65 + answer.selectedOptionIndex)}. ${question.options[answer.selectedOptionIndex]}`
                                                            : "Not Answered"
                                                        }
                                                    </p>
                                                </div>

                                                <div className="bg-green-50 p-3 rounded border border-green-200">
                                                    <p className="text-sm text-gray-600">Correct Answer:</p>
                                                    <p className="font-medium text-green-800">
                                                        {String.fromCharCode(65 + question.correctAnswerIndex)}. {question.options[question.correctAnswerIndex]}
                                                    </p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className={`p-3 rounded border text-center ${answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                        <p className="text-sm text-gray-600">Result</p>
                                                        <p className={`font-bold ${answer.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                                                            {answer.selectedOptionIndex === null ? "Not Answered" :
                                                                answer.isCorrect ? "Correct" : "Incorrect"}
                                                        </p>
                                                    </div>
                                                    <div className="bg-blue-50 p-3 rounded border border-blue-200 text-center">
                                                        <p className="text-sm text-gray-600">Marks</p>
                                                        <p className="font-bold text-blue-800">
                                                            {answer.marksAwarded}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {selectedAttempt.remarks && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <p className="text-sm text-orange-800">
                            <strong>Remarks:</strong> {selectedAttempt.remarks}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttemptDetails;