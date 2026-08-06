import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaMapMarkerAlt, FaClock, FaHome } from 'react-icons/fa';
import { attendanceApi } from '../../api/attendanceApi';
import { settingApi } from '../../api/settingApi';
import { toast } from 'react-toastify';

const CheckIn = ({ onCheckIn }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [notes, setNotes] = useState('');
  const [isWFH, setIsWFH] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [officeLocation, setOfficeLocation] = useState(null);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  useEffect(() => {
    fetchOfficeLocation();
  }, []);

  const fetchOfficeLocation = async () => {
    try {
      const response = await settingApi.getOfficeLocation();
      if (response.success && response.data) {
        setOfficeLocation({
          latitude: response.data.latitude || 0,
          longitude: response.data.longitude || 0,
          radius: response.data.radius || 50
        });
      } else {
        // Fallback default values if API fails
        setOfficeLocation({
          latitude: 28.6139,
          longitude: 77.2090,
          radius: 50
        });
      }
    } catch (error) {
      console.error('Failed to fetch office location:', error);
      // Use fallback default values
      setOfficeLocation({
        latitude: 28.6139,
        longitude: 77.2090,
        radius: 50
      });
    }
  };

  const getLocation = () => {
    if (isWFH) {
      toast.info('Work from home selected - location not required');
      return;
    }

    setFetchingLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(userLocation);
          setLocationError('');
          checkLocationProximity(userLocation);
          toast.success('Location captured successfully');
          setFetchingLocation(false);
        },
        (error) => {
          let errorMsg = 'Unable to get location. Please enable GPS.';
          if (error.code === 1) {
            errorMsg = 'Location access denied. Please enable location permissions.';
          } else if (error.code === 2) {
            errorMsg = 'Location unavailable. Please try again.';
          } else if (error.code === 3) {
            errorMsg = 'Location request timed out. Please try again.';
          }
          setLocationError(errorMsg);
          toast.error(errorMsg);
          console.error('Geolocation error:', error);
          setFetchingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      const errorMsg = 'Geolocation is not supported by this browser.';
      setLocationError(errorMsg);
      toast.error(errorMsg);
      setFetchingLocation(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const checkLocationProximity = (userLocation) => {
    if (!officeLocation) return;

    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      officeLocation.latitude,
      officeLocation.longitude
    );

    const withinRadius = distance <= officeLocation.radius;
    setIsWithinRadius(withinRadius);

    if (!withinRadius) {
      setLocationError(`You are ${Math.round(distance)} meters away from office. Maximum allowed: ${officeLocation.radius} meters.`);
      toast.warning(`You are ${Math.round(distance)} meters away from office`);
    } else {
      setLocationError('');
      toast.success(`You are within ${officeLocation.radius} meters of office`);
    }
  };

  const handleCheckIn = async () => {
    // Validate notes
    if (!notes.trim()) {
      toast.warning('Please add notes about your check-in');
      return;
    }

    // Validate location for non-WFH
    if (!isWFH && !location) {
      toast.warning('Please capture your location first');
      return;
    }

    // Validate location proximity for non-WFH
    if (!isWFH && location && !isWithinRadius) {
      toast.warning('You are not within the office radius. Please check your location.');
      return;
    }

    setLoading(true);
    try {
      const data = {
        latitude: isWFH ? null : location?.latitude,
        longitude: isWFH ? null : location?.longitude,
        notes,
        isWFH,
        checkInType: isWFH ? 'wfh' : 'office'
      };
      const response = await attendanceApi.checkIn(data);
      toast.success(isWFH ? '✅ Work from home check-in successful!' : '✅ Check-in successful!');
      if (onCheckIn) onCheckIn(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to check in');
      console.error('Check-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Check In
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center space-x-2">
            <FaClock className="text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Current Time: {new Date().toLocaleTimeString()}
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString()}
          </span>
        </div>

        {/* WFH Toggle */}
        <div className="flex items-center space-x-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
          <input
            type="checkbox"
            id="wfhCheckIn"
            checked={isWFH}
            onChange={(e) => {
              setIsWFH(e.target.checked);
              if (e.target.checked) {
                setLocation(null);
                setLocationError('');
                setIsWithinRadius(false);
              }
            }}
            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <label htmlFor="wfhCheckIn" className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            <FaHome className="text-indigo-600 dark:text-indigo-400" />
            <span>Work From Home</span>
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            (Location not required for WFH)
          </span>
        </div>

        {!isWFH && (
          <>
            <button
              onClick={getLocation}
              disabled={fetchingLocation}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50"
            >
              {fetchingLocation ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Getting Location...</span>
                </>
              ) : (
                <>
                  <FaMapMarkerAlt />
                  <span>{location ? 'Location Captured ✓' : 'Capture Location'}</span>
                </>
              )}
            </button>

            {location && (
              <div className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p>📍 Latitude: {location.latitude.toFixed(6)}</p>
                <p>📍 Longitude: {location.longitude.toFixed(6)}</p>
                {isWithinRadius ? (
                  <p className="text-green-600 dark:text-green-400 mt-1">✅ Within office radius</p>
                ) : (
                  <p className="text-red-600 dark:text-red-400 mt-1">❌ Outside office radius</p>
                )}
              </div>
            )}

            {locationError && (
              <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {locationError}
              </div>
            )}
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes *
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isWFH ? "Add notes about your work from home check-in..." : "Add notes about your check-in..."}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows="2"
            required
          />
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">* Notes are required</p>
        </div>

        <button
          onClick={handleCheckIn}
          disabled={loading || (!isWFH && !location) || (!isWFH && location && !isWithinRadius)}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg text-white font-medium transition-colors ${
            loading || (!isWFH && !location) || (!isWFH && location && !isWithinRadius)
              ? 'bg-gray-400 cursor-not-allowed'
              : isWFH ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Checking In...</span>
            </>
          ) : (
            <>
              {isWFH ? <FaHome /> : <FaCheckCircle />}
              <span>{isWFH ? 'Check In (WFH)' : 'Check In'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CheckIn;