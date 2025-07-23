import React from 'react';
import { Users, Calendar, BookOpen, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { format } from 'date-fns';

interface ClassroomCardProps {
  classroom: any;
  onClick: () => void;
}

export default function ClassroomCard({ classroom, onClick }: ClassroomCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{classroom.name}</h3>
            {classroom.subject && (
              <p className="text-sm text-gray-600 flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                {classroom.subject}
              </p>
            )}
          </div>
        <button
            className="text-gray-400 hover:text-gray-600"
            onClick={(e) => {
              e.stopPropagation(); // <--- THIS IS THE KEY CHANGE
              // You can add logic here if this button is supposed to do something else,
              // like open a context menu or dropdown.
              // For now, stopping propagation is enough to fix the main card click.
            }}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Users className="h-4 w-4 mr-2" />
            <span>{classroom.studentsCount || 0} Students</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Created {format(new Date(classroom.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {classroom.groupPhotoUploaded && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Photo Uploaded
            </span>
          )}
          {classroom.modelTrained && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Model Trained
            </span>
          )}
          {classroom.attendanceSessionsCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {classroom.attendanceSessionsCount} Sessions
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}