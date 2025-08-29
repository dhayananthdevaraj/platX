import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Trophy,
  TrendingUp,
  Clock,
  Target,
  BarChart3,
  Download,
  Eye,
  Calendar,
  Award
} from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';

interface Result {
  _id: string;
  student: {
    _id: string;
    name: string;
    email: string;
  };
  test: {
    _id: string;
    title: string;
    type: string;
    subject: string;
    duration: number;
    totalMarks: number;
  };
  score: {
    total: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    percentage: number;
  };
  timeTaken: number;
  rank: {
    overall: number;
    centerWise?: number;
  };
  subjectWiseScore: Array<{
    subject: string;
    correct: number;
    incorrect: number;
    unattempted: number;
    marks: number;
  }>;
  createdAt: string;
}

const Results: React.FC = () => {
  const { user } = useAuth();
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      let endpoint = '/results/';
      
      if (user?.role === 'student') {
        endpoint = `/results/student/${user.id}`;
      }
      
      const response = await axios.get(endpoint);
      setResults(response.data.results);
    } catch (error) {
      console.error('Failed to fetch results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (percentage >= 80) return { text: 'Very Good', color: 'bg-blue-100 text-blue-800' };
    if (percentage >= 70) return { text: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 60) return { text: 'Average', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Needs Improvement', color: 'bg-red-100 text-red-800' };
  };

  const showResultDetail = (result: Result) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  if (loading) {
    return <LoadingSpinner text="Loading results..." />;
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Results</h1>
          <p className="text-gray-600 mt-1">
            {user?.role === 'student' ? 'Your test results and performance' : 'Student test results'}
          </p>
        </div>
      </div>

      {/* Summary Stats for Students */}
      {user?.role === 'student' && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Trophy className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tests Taken</p>
                <p className="text-2xl font-bold text-gray-900">{results.length}</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(results.reduce((acc, r) => acc + r.score.percentage, 0) / results.length)}%
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Best Score</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.max(...results.map(r => r.score.percentage)).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Improvement</p>
                <p className="text-2xl font-bold text-gray-900">
                  {results.length >= 2 ? 
                    `${(results[0].score.percentage - results[results.length - 1].score.percentage).toFixed(1)}%`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Details
                </th>
                {user?.role !== 'student' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.map((result) => {
                const badge = getPerformanceBadge(result.score.percentage);
                
                return (
                  <tr key={result._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {result.test.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.test.type} • {result.test.subject}
                        </div>
                      </div>
                    </td>
                    
                    {user?.role !== 'student' && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {result.student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.student.email}
                        </div>
                      </td>
                    )}
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className={`font-bold ${getPerformanceColor(result.score.percentage)}`}>
                          {result.score.percentage.toFixed(1)}%
                        </div>
                        <div className="text-gray-500">
                          {result.score.total}/{result.test.totalMarks}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                        {badge.text}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {result.timeTaken} min
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Trophy className="h-4 w-4 mr-1 text-gray-400" />
                        #{result.rank.overall}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(result.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => showResultDetail(result)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {results.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">
              {user?.role === 'student' 
                ? 'You haven\'t taken any tests yet'
                : 'No test results available'
              }
            </p>
          </div>
        )}
      </div>

      {/* Result Detail Modal */}
      {showDetailModal && selectedResult && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {selectedResult.test.title} - Detailed Results
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="card p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Overall Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Score:</span>
                      <span className={`font-bold ${getPerformanceColor(selectedResult.score.percentage)}`}>
                        {selectedResult.score.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Marks:</span>
                      <span>{selectedResult.score.total}/{selectedResult.test.totalMarks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rank:</span>
                      <span>#{selectedResult.rank.overall}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time Taken:</span>
                      <span>{selectedResult.timeTaken} min</span>
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Question Analysis</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-green-600">Correct:</span>
                      <span className="font-medium">{selectedResult.score.correct}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600">Incorrect:</span>
                      <span className="font-medium">{selectedResult.score.incorrect}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unattempted:</span>
                      <span className="font-medium">{selectedResult.score.unattempted}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Subject-wise Performance</h4>
                <div className="space-y-3">
                  {selectedResult.subjectWiseScore.map((subject, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{subject.subject}</span>
                        <span className="text-sm font-bold text-primary-600">
                          {subject.marks} marks
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span className="text-green-600">✓ {subject.correct}</span>
                        <span className="text-red-600">✗ {subject.incorrect}</span>
                        <span className="text-gray-500">— {subject.unattempted}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
              <button className="btn btn-primary">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;