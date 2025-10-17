import * as FileSystem from 'expo-file-system';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Platform } from 'react-native';

const dir = `${FileSystem.cacheDirectory}video-thumbs/`;

async function ensureDir() {
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  } catch (e) {
    // ignore
  }
}

function safeName(url) {
  return url.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function getVideoThumbnail(uri, opts = { time: 5000 }) {
  await ensureDir();
  const key = safeName(uri);
  const target = `${dir}${key}.jpg`;
  try {
    const info = await FileSystem.getInfoAsync(target);
    if (info.exists) return target;
  } catch {}

  try {
    const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(uri, opts);
    // Move to cache dir with deterministic name
    await FileSystem.moveAsync({ from: thumbUri, to: target });
    return target;
  } catch (e) {
    // fallback: no thumbnail
    return null;
  }
}

export async function purgeOldThumbnails() {
  try {
    const listing = await FileSystem.readDirectoryAsync(dir);
    // Optionally implement TTL purge here
    return listing.length;
  } catch {
    return 0;
  }
}
