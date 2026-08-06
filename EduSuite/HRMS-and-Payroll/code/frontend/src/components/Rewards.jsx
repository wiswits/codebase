// frontend/src/components/Rewards.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function Rewards({ employeeId }) {
  const { showToast } = useToast();
  const [rewards, setRewards] = useState([]);
  const [badges, setBadges] = useState([]);
  const [allRewards, setAllRewards] = useState([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('my');
  const [showRewardForm, setShowRewardForm] = useState(false);
  const [employees, setEmployees] = useState([]);

  const [rewardForm, setRewardForm] = useState({
    employee_id: '',
    reward_type: 'SPOT',
    title: '',
    description: '',
    points: 10,
    awarded_by: employeeId
  });

  const [badgeForm, setBadgeForm] = useState({
    employee_id: '',
    badge_name: '',
    badge_icon: '🏆',
    description: ''
  });

  useEffect(() => {
    fetchData();
    fetchEmployees();
  }, [employeeId]);

  const fetchData = async () => {
    try {
      const [rewardsRes, badgesRes, pointsRes, allRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/rewards/rewards/${employeeId}`),
        fetch(`${API_URL}/api/v1/rewards/badges/${employeeId}`),
        fetch(`${API_URL}/api/v1/rewards/points/${employeeId}`),
        fetch(`${API_URL}/api/v1/rewards/rewards/all`)
      ]);
      const rewardsData = await rewardsRes.json();
      const badgesData = await badgesRes.json();
      const pointsData = await pointsRes.json();
      const allData = await allRes.json();
      setRewards(rewardsData.data || []);
      setBadges(badgesData.data || []);
      setPoints(pointsData.data?.total_points || 0);
      setAllRewards(allData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/employees`);
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleRewardSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/rewards/rewards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rewardForm)
      });
      if (response.ok) {
        showToast('✅ Reward awarded!', 'success');
        fetchData();
        setShowRewardForm(false);
        setRewardForm({ employee_id: '', reward_type: 'SPOT', title: '', description: '', points: 10, awarded_by: employeeId });
      }
    } catch (error) {
      showToast('❌ Failed to award reward', 'error');
    }
  };

  const handleBadgeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/rewards/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(badgeForm)
      });
      if (response.ok) {
        showToast('✅ Badge awarded!', 'success');
        fetchData();
        setBadgeForm({ employee_id: '', badge_name: '', badge_icon: '🏆', description: '' });
      }
    } catch (error) {
      showToast('❌ Failed to award badge', 'error');
    }
  };

  const getRewardTypeEmoji = (type) => {
    const emojis = {
      SPOT: '⭐',
      MONTHLY: '🏅',
      QUARTERLY: '🎖️',
      ANNUAL: '🏆',
      TEAM: '👥'
    };
    return emojis[type] || '⭐';
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="font-bold text-gray-800 dark:text-white">🏆 Rewards & Recognition</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('my')}
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'my' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            My Rewards
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1 rounded-lg text-sm ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            All Rewards
          </button>
          <button
            onClick={() => setShowRewardForm(!showRewardForm)}
            className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-blue-700"
          >
            {showRewardForm ? 'Cancel' : '+ Award Reward'}
          </button>
        </div>
      </div>

      {/* Points Display */}
      <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">Your Total Points</p>
        <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{points}</p>
      </div>

      {/* Award Reward Form */}
      {showRewardForm && (
        <form onSubmit={handleRewardSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select value={rewardForm.employee_id} onChange={(e) => setRewardForm({ ...rewardForm, employee_id: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required>
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </select>
            <select value={rewardForm.reward_type} onChange={(e) => setRewardForm({ ...rewardForm, reward_type: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <option value="SPOT">Spot Award</option>
              <option value="MONTHLY">Monthly Award</option>
              <option value="QUARTERLY">Quarterly Award</option>
              <option value="ANNUAL">Annual Award</option>
              <option value="TEAM">Team Award</option>
            </select>
            <input type="text" placeholder="Title" value={rewardForm.title} onChange={(e) => setRewardForm({ ...rewardForm, title: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white col-span-2" required />
            <textarea placeholder="Description" value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white col-span-2" rows="2" />
            <input type="number" placeholder="Points" value={rewardForm.points} onChange={(e) => setRewardForm({ ...rewardForm, points: parseInt(e.target.value) })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
          </div>
          <button type="submit" className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Award Reward</button>
        </form>
      )}

      {/* Badge Form */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">🏅 Award Badge</h4>
        <form onSubmit={handleBadgeSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={badgeForm.employee_id} onChange={(e) => setBadgeForm({ ...badgeForm, employee_id: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required>
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
            ))}
          </select>
          <input type="text" placeholder="Badge Name" value={badgeForm.badge_name} onChange={(e) => setBadgeForm({ ...badgeForm, badge_name: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
          <input type="text" placeholder="Badge Icon (emoji)" value={badgeForm.badge_icon} onChange={(e) => setBadgeForm({ ...badgeForm, badge_icon: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
          <button type="submit" className="md:col-span-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">Award Badge</button>
        </form>
      </div>

      {/* Badges Display */}
      {badges.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">🏅 My Badges</h4>
          <div className="flex flex-wrap gap-3">
            {badges.map(badge => (
              <div key={badge.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center shadow-sm">
                <div className="text-3xl">{badge.badge_icon}</div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{badge.badge_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards List */}
      <div>
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">📋 Rewards</h4>
        <div className="space-y-3">
          {(viewMode === 'my' ? rewards : allRewards).map(reward => (
            <div key={reward.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getRewardTypeEmoji(reward.reward_type)}</span>
                    <h5 className="font-bold text-gray-800 dark:text-white">{reward.title}</h5>
                    <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">+{reward.points} pts</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{reward.description}</p>
                  {viewMode === 'all' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Employee: {reward.employee_name}</p>
                  )}
                  <p className="text-xs text-gray-400">Awarded by: {reward.awarded_by_name} • {new Date(reward.awarded_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
          {((viewMode === 'my' ? rewards : allRewards).length === 0) && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">No rewards yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Rewards;