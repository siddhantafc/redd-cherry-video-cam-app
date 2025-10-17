import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '@env';
import { AuthStorage } from '../utils/authStorage';

export function useFeedMedia(userId) {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMedia = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await AuthStorage.getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [imgRes, vidRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/feed/images?userId=${encodeURIComponent(userId)}`, { headers }),
        fetch(`${API_BASE_URL}/api/feed/videos?userId=${encodeURIComponent(userId)}`, { headers }),
      ]);
      if (!imgRes.ok) throw new Error(`Images ${imgRes.status}`);
      if (!vidRes.ok) throw new Error(`Videos ${vidRes.status}`);
      const imgJson = await imgRes.json();
      const vidJson = await vidRes.json();
      setImages(imgJson.images || []);
      setVideos(vidJson.videos || []);
    } catch (e) {
      setError(e.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return { images, videos, loading, error, refetch: fetchMedia };
}
