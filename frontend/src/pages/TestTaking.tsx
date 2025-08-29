import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  Circle,
  Flag,
  ArrowLeft,
  ArrowRight,
  Send
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface Question {
  _id: string;
  question: string;
  type: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer: string;
  marks: number;
  negativeMarks: number;
}

interface Test {
  _id: string;
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
  questions: Question[];
  instructions: string[];
  negativeMarking: {
    enabled: boolean;
    marks: number;
  };
}

const TestTaking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTest();
    }
  }, [id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    console.log('testStarted:', testStarted, 'timeLeft:', timeLeft);
    
    if (testStarted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitTest(true); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testStarted, timeLeft]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/tests/${id}`);
      setTest(response.data.test);
      setTimeLeft(response.data.test.duration * 60); // Convert minutes to seconds
    } catch (error: any) {
      console.error('Failed to fetch test:', error);
      toast.error(error.response?.data?.message || 'Failed to load test');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setStartTime(new Date());
    toast.success('Test started! Good luck!');
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged(prev => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId);
      } else {
        newFlagged.add(questionId);
      }
      return newFlagged;
    });
  };

  const handleSubmitTest = async (autoSubmit = false) => {
    if (!testStarted || !test || !startTime) return;

    const confirmSubmit = autoSubmit || window.confirm(
      'Are you sure you want to submit the test? This action cannot be undone.'
    );

    if (!confirmSubmit) return;

    try {
      setSubmitting(true);
      
      const endTime = new Date();
      const timeTaken = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60); // in minutes
      
      const submissionData = {
        testId: test._id,
        answers: test.questions.map(question => ({
          questionId: question._id,
          selectedAnswer: answers[question._id] || '',
          timeSpent: 0 // Could track individual question time
        })),
        timeTaken,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };

      await axios.post('/results/submit', submissionData);
      
      toast.success(autoSubmit ? 'Test auto-submitted!' : 'Test submitted successfully!');
      navigate('/results');
    } catch (error: any) {
      console.error('Failed to submit test:', error);
      toast.error(error.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId: string) => {
    if (answers[questionId]) return 'answered';
    if (flagged.has(questionId)) return 'flagged';
    return 'unanswered';
  };

  if (loading) {
    return <LoadingSpinner text="Loading test..." />;
  }

  if (!test) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Test not found</h3>
        <button onClick={() => navigate('/tests')} className="btn btn-primary">
          Back to Tests
        </button>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{test.title}</h1>
            <p className="text-gray-600 mb-6">{test.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-lg font-semibold text-gray-900">{test.duration} minutes</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Questions</p>
              <p className="text-lg font-semibold text-gray-900">{test.questions.length}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Flag className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Marks</p>
              <p className="text-lg font-semibold text-gray-900">{test.totalMarks}</p>
            </div>
          </div>

          {test.instructions.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {test.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-yellow-600 mr-2">•</span>
                      <span className="text-sm text-gray-700">{instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {test.negativeMarking.enabled && (
            <div className="mb-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                  <p className="text-sm text-red-800">
                    <strong>Negative Marking:</strong> {test.negativeMarking.marks} marks will be deducted for each wrong answer.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={startTest}
              className="btn btn-primary px-8 py-3 text-lg"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = test.questions[currentQuestion];

  return (

    <div className="max-w-7xl mx-auto">
      jsd
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-3">
          <div className="card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{test.title}</h2>
                <p className="text-sm text-gray-600">
                  Question {currentQuestion + 1} of {test.questions.length}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`flex items-center px-3 py-2 rounded-lg ${
                  timeLeft < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  <Clock className="h-4 w-4 mr-2" />
                  <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
                </div>
                <button
                  onClick={() => toggleFlag(currentQ._id)}
                  className={`p-2 rounded-lg transition-colors ${
                    flagged.has(currentQ._id)
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Flag className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Question */}
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex-1">
                  {currentQ.question}
                </h3>
                <div className="ml-4 text-sm text-gray-600">
                  <span className="font-medium">+{currentQ.marks}</span>
                  {test.negativeMarking.enabled && (
                    <span className="text-red-600 ml-2">-{currentQ.negativeMarks}</span>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => {
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D
                  const isSelected = answers[currentQ._id] === option.text;
                  
                  return (
                    <label
                      key={index}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ._id}`}
                        value={option.text}
                        checked={isSelected}
                        onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                        isSelected
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                      <span className="font-medium text-gray-700 mr-3">{optionLabel}.</span>
                      <span className="text-gray-900">{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => handleAnswerChange(currentQ._id, '')}
                  className="btn btn-secondary"
                >
                  Clear Response
                </button>
                
                {currentQuestion === test.questions.length - 1 ? (
                  <button
                    onClick={() => handleSubmitTest()}
                    disabled={submitting}
                    className="btn btn-primary"
                  >
                    {submitting ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Test
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestion(Math.min(test.questions.length - 1, currentQuestion + 1))}
                    className="btn btn-primary"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="lg:col-span-1">
          <div className="card p-4 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Palette</h3>
            
            <div className="grid grid-cols-5 gap-2 mb-4">
              {test.questions.map((question, index) => {
                const status = getQuestionStatus(question._id);
                const isCurrent = index === currentQuestion;
                
                return (
                  <button
                    key={question._id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                      isCurrent
                        ? 'ring-2 ring-primary-500 ring-offset-2'
                        : ''
                    } ${
                      status === 'answered'
                        ? 'bg-green-500 text-white'
                        : status === 'flagged'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                <span>Flagged</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
                <span>Not Answered</span>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-medium text-green-600">
                    {Object.keys(answers).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Flagged:</span>
                  <span className="font-medium text-yellow-600">
                    {flagged.size}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Not Answered:</span>
                  <span className="font-medium text-gray-600">
                    {test.questions.length - Object.keys(answers).length}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleSubmitTest()}
              disabled={submitting}
              className="w-full btn btn-primary mt-4"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTaking;