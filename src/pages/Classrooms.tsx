import React, { useState, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import ClassroomCard from '../components/classroom/ClassroomCard';
import CreateClassroomModal from '../components/classroom/CreateClassroomModal';
import { classroomAPI } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function Classrooms() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchClassrooms = async () => {
    try {
      const { data } = await classroomAPI.getAll();
      setClassrooms(data.classrooms);
    } catch (error) {
      console.error('Failed to fetch classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const filteredClassrooms = classrooms.filter((classroom: any) =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClassroomClick = (classroom: any) => {
    console.log("hello");
    navigate(`/classroom/${classroom.classroomId}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-48"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classrooms</h1>
          <p className="text-gray-600 mt-2">Manage your classrooms and attendance tracking</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Classroom
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Search classrooms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filteredClassrooms.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-48 h-48 mx-auto mb-4 opacity-20">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No classrooms found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first classroom</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Classroom
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClassrooms.map((classroom: any) => (
            <ClassroomCard
              key={classroom._id}
              classroom={classroom}
              onClick={() => handleClassroomClick(classroom)}
            />
          ))}
        </div>
      )}

      <CreateClassroomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchClassrooms}
      />
    </div>
  );
}