import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Edit,
  Save,
  X,
  Shield,
  BookOpen,
  Target
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    studentDetails: {
      rollNumber: user?.studentDetails?.rollNumber || '',
      class: user?.studentDetails?.class || '12th',
      stream: user?.studentDetails?.stream || 'PCM',
      targetExam: user?.studentDetails?.targetExam || 'JEE',
      parentName: user?.studentDetails?.parentName || '',
      parentPhone: user?.studentDetails?.parentPhone || ''
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await axios.put(`/users/${user?.id}`, formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      studentDetails: {
        rollNumber: user?.studentDetails?.rollNumber || '',
        class: user?.studentDetails?.class || '12th',
        stream: user?.studentDetails?.stream || 'PCM',
        targetExam: user?.studentDetails?.targetExam || 'JEE',
        parentName: user?.studentDetails?.parentName || '',
        parentPhone: user?.studentDetails?.parentPhone || ''
      }
    });
    setIsEditing(false);
  };

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

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
        <p className="text-gray-600">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account information</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary"
          >
            <Edit className="h-5 w-5 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{user.name}</h3>
            <p className="text-gray-600 mb-4">{user.email}</p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getRoleColor(user.role)}`}>
                  <Shield className="h-4 w-4 mr-1" />
                  {user.role.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </div>
              
              {user.center && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Building2 className="h-4 w-4 mr-1" />
                  {user.center.name}
                </div>
              )}
              
              {user.role === 'student' && user.studentDetails?.targetExam && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Target className="h-4 w-4 mr-1" />
                  Target: {user.studentDetails.targetExam}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-secondary"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>

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
                    <input
                      type="text"
                      className="input bg-gray-50"
                      value={user.role.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      disabled
                    />
                  </div>
                </div>

                {user.role === 'student' && (
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
              </form>
            ) : (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <div className="flex items-center mt-1">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{user.name}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <div className="flex items-center mt-1">
                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{user.email}</span>
                      </div>
                    </div>

                    {user.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <div className="flex items-center mt-1">
                          <Phone className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">{user.phone}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Role</label>
                      <div className="flex items-center mt-1">
                        <Shield className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">
                          {user.role.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                      </div>
                    </div>

                    {user.center && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Center</label>
                        <div className="flex items-center mt-1">
                          <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">{user.center.name}</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium text-gray-500">Member Since</label>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">
                          {new Date(user.createdAt || '').toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {user.role === 'student' && user.studentDetails && (
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Student Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {user.studentDetails.rollNumber && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Roll Number</label>
                            <p className="text-gray-900 mt-1">{user.studentDetails.rollNumber}</p>
                          </div>
                        )}

                        <div>
                          <label className="text-sm font-medium text-gray-500">Class</label>
                          <div className="flex items-center mt-1">
                            <BookOpen className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-900">{user.studentDetails.class}</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-500">Stream</label>
                          <p className="text-gray-900 mt-1">{user.studentDetails.stream}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Target Exam</label>
                          <div className="flex items-center mt-1">
                            <Target className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-gray-900">{user.studentDetails.targetExam}</span>
                          </div>
                        </div>

                        {user.studentDetails.parentName && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Parent Name</label>
                            <p className="text-gray-900 mt-1">{user.studentDetails.parentName}</p>
                          </div>
                        )}

                        {user.studentDetails.parentPhone && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Parent Phone</label>
                            <div className="flex items-center mt-1">
                              <Phone className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-gray-900">{user.studentDetails.parentPhone}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;