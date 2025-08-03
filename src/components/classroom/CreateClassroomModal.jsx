import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { classroomAPI } from '../../lib/api';
import toast from 'react-hot-toast';

export default function CreateClassroomModal({ isOpen, onClose, onSuccess }) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    academicYear: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await classroomAPI.create(formData);
      toast.success('Classroom created successfully!');
      onSuccess();
      onClose();
      setFormData({ name: '', subject: '', academicYear: '', description: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create classroom');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Classroom">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Classroom Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Computer Science A"
          />
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Computer Science"
          />
        </div>

        <div>
          <label htmlFor="academicYear" className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year
          </label>
          <input
            type="text"
            id="academicYear"
            name="academicYear"
            value={formData.academicYear}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2024-2025"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional description for the classroom"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            Create Classroom
          </Button>
        </div>
      </form>
    </Modal>
  );
}