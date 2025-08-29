import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Building2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  center: any;
  studentDetails?: {
    rollNumber: string;
    class: string;
    stream: string;
    targetExam: string;
    parentName: string;
    parentPhone: string;
  };
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

const Users: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    phone: '',
    center: '',
    studentDetails: {
      rollNumber: '',
      class: '12th',
      stream: 'PCM',
      targetExam: 'JEE',
      parentName: '',
      parentPhone: ''
    },
    isActive: true
  });

  const [centers, setCenters] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchCenters();
  }, [filterRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterRole) params.append('role', filterRole);
      
      const response = await axios.get(`/users?${params.toString()}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await axios.get('/centers');
      setCenters(response.data.centers);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData = {
        ...formData,
        studentDetails: formData.role === 'student' ? formData.studentDetails : undefined
      };

      if (editingUser) {
        await axios.put(`/users/${editingUser._id}`, userData);
        toast.success('User updated successfully');
      } else {
        await axios.post('/auth/register', userData);
        toast.success('User created successfully');
      }

      setShowCreateModal(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error('Failed to save user:', error);
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      center: user.center?._id || '',
      studentDetails: user.studentDetails || {
        rollNumber: '',
        class: '12th',
        stream: 'PCM',
        targetExam: 'JEE',
        parentName: '',
        parentPhone: ''
      },
      isActive: user.isActive
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await axios.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      phone: '',
      center: '',
      studentDetails: {
        rollNumber: '',
        class: '12th',
        stream: 'PCM',
        targetExam: 'JEE',
        parentName: '',
        parentPhone: ''
      },
      isActive: true
    });
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.phone && user.phone.includes(searchTerm))
  );

  const canCreateUser = ['superadmin', 'centeradmin'].includes(user?.role || '');
  const canEditUser = ['superadmin', 'centeradmin'].includes(user?.role || '');

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'contentadmin': return 'bg-purple-100 text-purple-800';
      case 'trainer': return 'bg-blue-100 text-blue-800';
      case 'centeradmin': return 'bg-yellow-100 text-yellow-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading users..." />;
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage platform users</p>
        </div>
        {canCreateUser && (
          <button
            onClick={() => {
              resetForm();
              setEditingUser(null);
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add User
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="input"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="superadmin">Super Admin</option>
            <option value="contentadmin">Content Admin</option>
            <option value="trainer">Trainer</option>
            <option value="centeradmin">Center Admin</option>
            <option value="student">Student</option>
          </select>
          
          <button
            onClick={() => {
              setFilterRole('');
              setSearchTerm('');
            }}
            className="btn btn-secondary"
          >
            <Filter className="h-5 w-5 mr-2" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                      {user.center?.name || 'N/A'}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-gray-400" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {canEditUser && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || filterRole
                ? 'Try adjusting your search or filters'
                : 'No users have been created yet'
              }
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      className="input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="label">Role</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="centeradmin">Center Admin</option>
                    {user?.role === 'superadmin' && (
                      <>
                        <option value="contentadmin">Content Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="label">Center</label>
                  <select
                    className="input"
                    value={formData.center}
                    onChange={(e) => setFormData({ ...formData, center: e.target.value })}
                    required={['student', 'trainer', 'centeradmin'].includes(formData.role)}
                  >
                    <option value="">Select Center</option>
                    {centers.map((center) => (
                      <option key={center._id} value={center._id}>
                        {center.name} ({center.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.role === 'student' && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Student Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Roll Number</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.studentDetails.rollNumber}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentDetails: { ...formData.studentDetails, rollNumber: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="label">Class</label>
                      <select
                        className="input"
                        value={formData.studentDetails.class}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentDetails: { ...formData.studentDetails, class: e.target.value }
                        })}
                      >
                        <option value="11th">11th</option>
                        <option value="12th">12th</option>
                        <option value="Dropper">Dropper</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Stream</label>
                      <select
                        className="input"
                        value={formData.studentDetails.stream}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentDetails: { ...formData.studentDetails, stream: e.target.value }
                        })}
                      >
                        <option value="PCM">PCM</option>
                        <option value="PCB">PCB</option>
                        <option value="PCMB">PCMB</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Target Exam</label>
                      <select
                        className="input"
                        value={formData.studentDetails.targetExam}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentDetails: { ...formData.studentDetails, targetExam: e.target.value }
                        })}
                      >
                        <option value="JEE">JEE</option>
                        <option value="NEET">NEET</option>
                        <option value="Both">Both</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">Parent Name</label>
                      <input
                        type="text"
                        className="input"
                        value={formData.studentDetails.parentName}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentDetails: { ...formData.studentDetails, parentName: e.target.value }
                        })}
                      />
                    </div>

                    <div>
                      <label className="label">Parent Phone</label>
                      <input
                        type="tel"
                        className="input"
                        value={formData.studentDetails.parentPhone}
                        onChange={(e) => setFormData({
                          ...formData,
                          studentDetails: { ...formData.studentDetails, parentPhone: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Status</label>
                <select
                  className="input"
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingUser(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;