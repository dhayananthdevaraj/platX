import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Users,
  School,
  FileText,
  BookOpen,
  Layers
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    institutes: 0,
    questionSets: 0,
    tests: 0,
    courses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const [usersRes, institutesRes, questionSetsRes, testsRes, coursesRes] = await Promise.all([
          axios.get('http://localhost:7071/api/users'),
          axios.get('http://localhost:7071/api/institutes'),
          axios.get('http://localhost:7071/api/questionset/all'),
          axios.get('http://localhost:7071/api/test/all'),
          axios.get('http://localhost:7071/api/course/all')
        ]);

        setStats({
          users: usersRes.data.count || 0,
          institutes: institutesRes.data.count || 0,
          questionSets: questionSetsRes.data.count || 0,
          tests: testsRes.data.count || 0,
          courses: coursesRes.data.count || 0
        });
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

  const statCard = (Icon, label, value, bgColor = 'bg-blue-100', iconColor = 'text-blue-600') => (
    <div className="card p-6">
      <div className="flex items-center">
        <div className={`p-3 ${bgColor} rounded-lg`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCard(Users, 'Total Users', stats.users)}
        {statCard(School, 'Institutes', stats.institutes, 'bg-green-100', 'text-green-600')}
        {statCard(FileText, 'Question Sets', stats.questionSets, 'bg-yellow-100', 'text-yellow-600')}
        {statCard(Layers, 'Tests', stats.tests, 'bg-purple-100', 'text-purple-600')}
        {statCard(BookOpen, 'Courses', stats.courses, 'bg-red-100', 'text-red-600')}
      </div>
    </div>
  );
};

export default Dashboard;
