export const getImageUrl = (url) => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
  return `${serverUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};
