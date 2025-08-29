import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Settings
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface Center {
  _id: string;
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
  admin: any;
  capacity: number;
  facilities: string[];
  isActive: boolean;
  createdAt: string;
}

const Centers: React.FC = () => {
  const { user } = useAuth();
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCenter, setEditingCenter] = useState<Center | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    capacity: 100,
    facilities: [] as string[],
    isActive: true
  });

  const facilityOptions = [
    'Computer Lab',
    'Library',
    'Cafeteria',
    'Parking',
    'AC Rooms',
    'WiFi'
  ];

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/centers');
      setCenters(response.data.centers);
    } catch (error) {
      console.error('Failed to fetch centers:', error);
      toast.error('Failed to load centers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCenter) {
        await axios.put(`/centers/${editingCenter._id}`, formData);
        toast.success('Center updated successfully');
      } else {
        await axios.post('/centers', formData);
        toast.success('Center created successfully');
      }

      setShowCreateModal(false);
      setEditingCenter(null);
      resetForm();
      fetchCenters();
    } catch (error: any) {
      console.error('Failed to save center:', error);
      toast.error(error.response?.data?.message || 'Failed to save center');
    }
  };

  const handleEdit = (center: Center) => {
    setEditingCenter(center);
    setFormData({
      name: center.name,
      code: center.code,
      address: center.address,
      contactInfo: center.contactInfo,
      capacity: center.capacity,
      facilities: center.facilities,
      isActive: center.isActive
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (centerId: string) => {
    if (!window.confirm('Are you sure you want to delete this center?')) return;
    
    try {
      await axios.delete(`/centers/${centerId}`);
      toast.success('Center deleted successfully');
      fetchCenters();
    } catch (error) {
      console.error('Failed to delete center:', error);
      toast.error('Failed to delete center');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      contactInfo: {
        phone: '',
        email: '',
        website: ''
      },
      capacity: 100,
      facilities: [],
      isActive: true
    });
  };

  const handleFacilityChange = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const filteredCenters = centers.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.address.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canCreateCenter = user?.role === 'superadmin';
  const canEditCenter = ['superadmin', 'centeradmin'].includes(user?.role || '');

  if (loading) {
    return <LoadingSpinner text="Loading centers..." />;
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Centers</h1>
          <p className="text-gray-600 mt-1">Manage test centers</p>
        </div>
        {canCreateCenter && (
          <button
            onClick={() => {
              resetForm();
              setEditingCenter(null);
              setShowCreateModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Center
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card p-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search centers..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCenters.map((center) => (
          <div key={center._id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <Building2 className="h-5 w-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">{center.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">Code: {center.code}</p>
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  center.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {center.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              {canEditCenter && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(center)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {user?.role === 'superadmin' && (
                    <button
                      onClick={() => handleDelete(center._id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-start">
                <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p>{center.address.street}</p>
                  <p>{center.address.city}, {center.address.state} {center.address.pincode}</p>
                </div>
              </div>

              {center.contactInfo.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{center.contactInfo.phone}</span>
                </div>
              )}

              {center.contactInfo.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">{center.contactInfo.email}</span>
                </div>
              )}

              <div className="flex items-center">
                <Users className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Capacity: {center.capacity}</span>
              </div>

              {center.facilities.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Facilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {center.facilities.slice(0, 3).map((facility, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {facility}
                      </span>
                    ))}
                    {center.facilities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{center.facilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Created: {new Date(center.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredCenters.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No centers found</h3>
          <p className="text-gray-600">
            {searchTerm
              ? 'Try adjusting your search'
              : 'No centers have been created yet'}
          </p>
        </div>
      )}

      {/* Create/Edit Center Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingCenter ? 'Edit Center' : 'Create New Center'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingCenter(null);
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
                  <label className="label">Center Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Center Code</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="label">Street Address</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.street}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <label className="label">City</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <label className="label">State</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.state}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <label className="label">Pincode</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.pincode}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, pincode: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <label className="label">Country</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.address.country}
                      onChange={(e) => setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      className="input"
                      value={formData.contactInfo.phone}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, phone: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <label className="label">Email</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.contactInfo.email}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, email: e.target.value }
                      })}
                    />
                  </div>

                  <div>
                    <label className="label">Website</label>
                    <input
                      type="url"
                      className="input"
                      value={formData.contactInfo.website}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactInfo: { ...formData.contactInfo, website: e.target.value }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Capacity</label>
                  <input
                    type="number"
                    className="input"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>

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
              </div>

              <div>
                <label className="label">Facilities</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {facilityOptions.map((facility) => (
                    <label key={facility} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.facilities.includes(facility)}
                        onChange={() => handleFacilityChange(facility)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{facility}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingCenter(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCenter ? 'Update Center' : 'Create Center'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Centers;