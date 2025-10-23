import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AttendanceAnalysisPage = () => {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [timeRange, setTimeRange] = useState('month');
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Base URL for API calls
  const API_BASE = '/api/attendance'; // Update this to match your backend URL

  // Fetch available grades on component mount
  useEffect(() => {
    fetchGrades();
  }, []);

  // Fetch subjects and classes when grade changes
  useEffect(() => {
    if (selectedGrade) {
      fetchSubjects();
      fetchClassesByGrade();
    } else {
      setSubjects([]);
      setClasses([]);
      setSelectedSubject('');
      setSelectedClass('');
    }
  }, [selectedGrade]);

  // Fetch analysis when grade, subject, and time range changes
  useEffect(() => {
    if (selectedGrade && selectedSubject) {
      fetchAnalysis();
    }
  }, [selectedGrade, selectedSubject, timeRange]);

  const fetchGrades = async () => {
    try {
      setError('');
      const response = await fetch(`${API_BASE}/grades`);
      if (!response.ok) throw new Error('Failed to fetch grades');
      const data = await response.json();
      console.log('Fetched grades:', data);
      setGrades(data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
      setError('Failed to load grades. Please check if the backend is running.');
      setGrades([]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${API_BASE}/analysis/subjects/${selectedGrade}`);
      if (!response.ok) throw new Error('Failed to fetch subjects');
      const data = await response.json();
      console.log('Fetched subjects:', data);
      setSubjects(data || []);
      setSelectedSubject(''); // Reset subject selection
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  const fetchClassesByGrade = async () => {
    try {
      const response = await fetch(`${API_BASE}/classes/by-grade/${selectedGrade}`);
      if (!response.ok) throw new Error('Failed to fetch classes');
      const data = await response.json();
      console.log('Fetched classes:', data);
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setClasses([]);
    }
  };

  const fetchAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const url = `${API_BASE}/analysis/comprehensive/${selectedGrade}/${encodeURIComponent(selectedSubject)}?timeRange=${timeRange}`;
      console.log('Fetching analysis from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Fetched analysis data:', data);
      setAnalysisData(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      setError(`Failed to load attendance analysis: ${error.message}`);
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  // Chart data preparation
  const chartData = analysisData?.chartData?.length > 0 ? {
    labels: analysisData.chartData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-GB', {
        month: 'short',
        day: 'numeric'
      });
    }),
    datasets: [
      {
        label: 'Present',
        data: analysisData.chartData.map(item => item.present),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2
      },
      {
        label: 'Absent',
        data: analysisData.chartData.map(item => item.absent),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2
      },
      {
        label: 'Late',
        data: analysisData.chartData.map(item => item.late),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: 'rgba(245, 158, 11, 1)',
        borderWidth: 2
      }
    ]
  } : null;

  // Pie chart for overall attendance distribution
  const pieChartData = analysisData?.students?.length > 0 ? {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{
      data: [
        analysisData.students.reduce((sum, student) => sum + student.attendanceStats.presentCount, 0),
        analysisData.students.reduce((sum, student) => sum + student.attendanceStats.absentCount, 0),
        analysisData.students.reduce((sum, student) => sum + student.attendanceStats.lateCount, 0),
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)',
        'rgba(245, 158, 11, 1)',
      ],
      borderWidth: 2
    }]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Attendance Analysis - ${selectedSubject} (Grade ${selectedGrade})`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Students'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Overall Attendance Distribution',
      },
    },
  };

  const getAttendanceRateColor = (rate) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Student Attendance History Analysis</h1>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Select Grade and Subject</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Grade Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Grade *
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">Select Grade</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
            {grades.length === 0 && !error && (
              <p className="text-sm text-gray-500 mt-1">Loading grades...</p>
            )}
          </div>

          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={!selectedGrade}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Subject</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            {selectedGrade && subjects.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">No subjects found for this grade</p>
            )}
          </div>

          {/* Class Selection (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class (Optional)
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={!selectedGrade}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Classes</option>
              {classes.map(classItem => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.subject} - {classItem.teacherName}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading attendance analysis...</p>
        </div>
      )}

      {/* Analysis Results */}
      {analysisData && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
              <h3 className="text-sm font-medium text-blue-100">Total Students</h3>
              <p className="text-3xl font-bold">{analysisData.summary?.totalStudents || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
              <h3 className="text-sm font-medium text-green-100">Overall Attendance</h3>
              <p className="text-3xl font-bold">{analysisData.summary?.overallAttendanceRate || 0}%</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
              <h3 className="text-sm font-medium text-purple-100">Total Classes</h3>
              <p className="text-3xl font-bold">{analysisData.summary?.totalClasses || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
              <h3 className="text-sm font-medium text-yellow-100">Monthly Fee</h3>
              <p className="text-3xl font-bold">Rs. {analysisData.summary?.classInfo?.monthlyFees || 0}</p>
            </div>
          </div>

          {/* Payment Summary */}
          {analysisData.paymentSummary && (
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-800">Payment Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Paid Students</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analysisData.paymentSummary.paidStudents} / {analysisData.paymentSummary.totalStudents}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
                  <p className="text-2xl font-bold text-yellow-600">{analysisData.paymentSummary.pendingStudents}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Overdue Payments</p>
                  <p className="text-2xl font-bold text-red-600">{analysisData.paymentSummary.overdueStudents}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Revenue Collected</p>
                  <p className="text-2xl font-bold text-blue-600">Rs. {analysisData.paymentSummary.collectedRevenue}</p>
                </div>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Bar Chart */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Daily Attendance Chart</h2>
              {chartData ? (
                <Bar data={chartData} options={chartOptions} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No chart data available</p>
                </div>
              )}
            </div>

            {/* Pie Chart */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Attendance Distribution</h2>
              {pieChartData ? (
                <Doughnut data={pieChartData} options={pieChartOptions} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No data available for pie chart</p>
                </div>
              )}
            </div>
          </div>

          {/* Student Details Table */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-6 text-gray-800">Student Details</h2>
            {analysisData.students && analysisData.students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Present/Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analysisData.students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">{student.registerNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-bold ${getAttendanceRateColor(student.attendanceStats?.attendanceRate || 0)}`}>
                            {student.attendanceStats?.attendanceRate || 0}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.attendanceStats?.presentCount || 0} / {student.attendanceStats?.totalClasses || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(student.paymentStatus || 'pending')}`}>
                            {student.paymentStatus || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No student data available</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* No Data Message */}
      {!loading && !analysisData && selectedGrade && selectedSubject && !error && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-6">
          <p>No attendance data found for Grade {selectedGrade} - {selectedSubject}. Please ensure there are students registered and attendance records exist.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceAnalysisPage;