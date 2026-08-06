// frontend/src/components/LearningManagement.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function LearningManagement({ employeeId }) {
  const { showToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [modules, setModules] = useState([]);

  const [courseForm, setCourseForm] = useState({
    title: '', description: '', category: '', duration_hours: '',
    instructor: '', course_url: '', thumbnail_url: '', status: 'DRAFT'
  });

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    try {
      const [coursesRes, enrollRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/lms/courses`),
        fetch(`${API_URL}/api/v1/lms/enrollments/${employeeId}`)
      ]);
      const coursesData = await coursesRes.json();
      const enrollData = await enrollRes.json();
      setCourses(coursesData.data || []);
      setEnrollments(enrollData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async (courseId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/lms/modules/${courseId}`);
      const data = await response.json();
      setModules(data.data || []);
      setSelectedCourse(courseId);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/lms/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...courseForm, duration_hours: parseFloat(courseForm.duration_hours) })
      });
      if (response.ok) {
        showToast('✅ Course created!', 'success');
        fetchData();
        setShowCourseForm(false);
        setCourseForm({ title: '', description: '', category: '', duration_hours: '', instructor: '', course_url: '', thumbnail_url: '', status: 'DRAFT' });
      }
    } catch (error) {
      showToast('❌ Failed to create course', 'error');
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/lms/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId, course_id: courseId })
      });
      if (response.ok) {
        showToast('✅ Enrolled successfully!', 'success');
        fetchData();
      } else {
        const data = await response.json();
        showToast('❌ ' + (data.error?.message || 'Failed to enroll'), 'error');
      }
    } catch (error) {
      showToast('❌ Network error', 'error');
    }
  };

  const isEnrolled = (courseId) => {
    return enrollments.some(e => e.course_id === courseId);
  };

  const getEnrollmentStatus = (courseId) => {
    const enrollment = enrollments.find(e => e.course_id === courseId);
    return enrollment?.status || 'NOT_ENROLLED';
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PUBLISHED: 'bg-green-100 text-green-700',
      ARCHIVED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getProgressBadge = (status) => {
    const colors = {
      NOT_STARTED: 'bg-gray-100 text-gray-700',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
      COMPLETED: 'bg-green-100 text-green-700',
      DROPPED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-4">Loading courses...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white">📚 Learning Management</h3>
        <button
          onClick={() => setShowCourseForm(!showCourseForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          {showCourseForm ? 'Cancel' : '+ New Course'}
        </button>
      </div>

      {showCourseForm && (
        <form onSubmit={handleCourseSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Course Title" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <input type="text" placeholder="Category" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <input type="number" placeholder="Duration (hours)" value={courseForm.duration_hours} onChange={(e) => setCourseForm({ ...courseForm, duration_hours: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <input type="text" placeholder="Instructor" value={courseForm.instructor} onChange={(e) => setCourseForm({ ...courseForm, instructor: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <input type="text" placeholder="Course URL" value={courseForm.course_url} onChange={(e) => setCourseForm({ ...courseForm, course_url: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <input type="text" placeholder="Thumbnail URL" value={courseForm.thumbnail_url} onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <textarea placeholder="Description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white col-span-2" rows="3" />
            <select value={courseForm.status} onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <button type="submit" className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create Course</button>
        </form>
      )}

      {/* My Enrollments */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">📖 My Courses</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrollments.map(enrollment => (
            <div key={enrollment.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              <h5 className="font-bold text-gray-800 dark:text-white">{enrollment.course_title}</h5>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${getProgressBadge(enrollment.status)}`}>{enrollment.status}</span>
                <span className="text-xs text-gray-500">Progress: {enrollment.progress}%</span>
              </div>
              <button
                onClick={() => fetchModules(enrollment.course_id)}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                View Modules
              </button>
            </div>
          ))}
          {enrollments.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8 col-span-3">No courses enrolled yet</div>
          )}
        </div>
      </div>

      {/* Available Courses */}
      <div>
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">🎯 Available Courses</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.filter(c => c.status === 'PUBLISHED').map(course => (
            <div key={course.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              {course.thumbnail_url && (
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-2" />
              )}
              <h5 className="font-bold text-gray-800 dark:text-white">{course.title}</h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">{course.category} • {course.duration_hours}h</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Instructor: {course.instructor || 'TBD'}</p>
              <div className="mt-2 flex items-center gap-2">
                {isEnrolled(course.id) ? (
                  <span className={`text-xs px-2 py-1 rounded ${getProgressBadge(getEnrollmentStatus(course.id))}`}>
                    {getEnrollmentStatus(course.id)}
                  </span>
                ) : (
                  <button
                    onClick={() => handleEnroll(course.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                  >
                    Enroll
                  </button>
                )}
              </div>
            </div>
          ))}
          {courses.filter(c => c.status === 'PUBLISHED').length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8 col-span-3">No courses available</div>
          )}
        </div>
      </div>

      {/* Modules Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-800 dark:text-white">📋 Course Modules</h4>
              <button onClick={() => setSelectedCourse(null)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
            {modules.length === 0 ? (
              <div className="text-center text-gray-500 py-4">No modules available</div>
            ) : (
              <div className="space-y-2">
                {modules.map(module => (
                  <div key={module.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h5 className="font-medium text-gray-800 dark:text-white">{module.module_title}</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{module.module_description}</p>
                    <p className="text-xs text-gray-400">{module.duration_minutes} min</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LearningManagement;