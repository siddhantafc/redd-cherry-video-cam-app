import { useState, useEffect, useCallback } from 'react';
import { useRealtimeStatus } from './useRealtimeStatus';
import { AuthStorage } from '../utils/authStorage';
import { API_BASE_URL } from '@env';

export const useUsers = (userRole) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Handle real-time status updates
  const handleStatusUpdate = useCallback((statusData) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === statusData.userId 
          ? { ...user, status: statusData.status, is_online: statusData.status === 'online' }
          : user
      )
    );
  }, []);

  // Initialize real-time status updates
  const { updateStatus } = useRealtimeStatus(handleStatusUpdate);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine the endpoint based on user role
      // If current user is host (role 1), fetch users (role 2)
      // If current user is user (role 2), fetch hosts (role 1)
      const endpoint = userRole === '1' ? '/api/profile/host/bulk' : '/api/profile/user/bulk';
      
      // Get auth token from storage
      const token = await AuthStorage.getToken();
      
      console.log('Fetching users with:', { endpoint, userRole, hasToken: !!token, apiUrl: API_BASE_URL });
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.log('Error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('Fetched users data:', data);
      setUsers(data.profiles || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole) {
      fetchUsers();
    }
  }, [userRole]);

  const refreshUsers = () => {
    fetchUsers();
  };

  return {
    users,
    loading,
    error,
    refreshUsers,
    updateStatus,
  };
};

export default useUsers;
