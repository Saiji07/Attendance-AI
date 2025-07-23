import React, { useState, useEffect } from 'react';
import { Users, BookOpen, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { classroomAPI, attendanceAPI } from '../lib/api';
import { useUser } from '@clerk/clerk-react';
import { authAPI } from '../lib/api';

export default function Dashboard() {
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    totalStudents: 0,
    totalSessions: 0,
    averageAttendance: 0  
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      if (user) {
        try {
          await authAPI.syncUser(user);
        } catch (error) {
          console.error('Failed to sync user:', error);
        }
      }
    };

    syncUser();
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await classroomAPI.getAll();
        const classrooms = data.classrooms;

        const totalStudents = classrooms.reduce((sum: number, classroom: any) => 
          sum + (classroom.studentsCount || 0), 0);
        
        const totalSessions = classrooms.reduce((sum: number, classroom: any) => 
          sum + (classroom.attendanceSessionsCount || 0), 0);

        // Calculate average attendance (simplified)
        let totalAttendanceSum = 0;
        let sessionCount = 0;

        for (const classroom of classrooms) {
          if (classroom.attendanceSessionsCount > 0) {
            try {
              const analyticsResponse = await attendanceAPI.getAnalytics(classroom.classroomId);
              totalAttendanceSum += analyticsResponse.data.averageAttendance || 0;
              sessionCount += 1;
            } catch (error) {
              console.error('Failed to get analytics for classroom:', classroom.classroomId);
            }
          }
        }

        setStats({
          totalClassrooms: classrooms.length,
          totalStudents,
          totalSessions,
          averageAttendance: sessionCount > 0 ? totalAttendanceSum / sessionCount : 0
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Classrooms',
      value: stats.totalClassrooms,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Attendance Sessions',
      value: stats.totalSessions,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Average Attendance',
      value: `${stats.averageAttendance.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg p-6 h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.firstName}! Here's your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Create New Classroom</div>
              <div className="text-sm text-gray-500">Set up a new class for attendance tracking</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">Take Attendance</div>
              <div className="text-sm text-gray-500">Record attendance for your classes</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">View Analytics</div>
              <div className="text-sm text-gray-500">Analyze attendance patterns and trends</div>
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-500 text-center py-8">
                No recent activity to display
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}