export type Platform = 'youtube' | 'instagram' | 'facebook' | 'unknown';

export interface VideoMetadata {
  id: string;
  platform: Platform;
  embedUrl: string;
  thumbnailUrl: string;
  aspectRatio: '16/9' | '9/16' | '1/1';
}

export const parseVideoUrl = (url: string): VideoMetadata | null => {
  try {
    const urlObj = new URL(url);
    const host = urlObj.hostname.toLowerCase();

    // YouTube
    if (host.includes('youtube.com') || host.includes('youtu.be')) {
      let id = '';
      if (host.includes('youtu.be')) {
        id = urlObj.pathname.slice(1);
      } else {
        id = urlObj.searchParams.get('v') || '';
        if (!id && urlObj.pathname.includes('/shorts/')) {
          id = urlObj.pathname.split('/shorts/')[1].split('?')[0];
        }
      }
      
      const isShort = url.includes('/shorts/');
      return {
        id,
        platform: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1`,
        // Try maxres, but fallback to hqdefault in the component if needed
        thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        aspectRatio: isShort ? '9/16' : '16/9'
      };
    }

    // Instagram
    if (host.includes('instagram.com')) {
      // Extract post ID - handle both /p/ and /reels/
      const parts = urlObj.pathname.split('/').filter(p => p);
      const idIndex = parts.findIndex(p => p === 'p' || p === 'reels' || p === 'reel');
      const rawId = idIndex !== -1 ? parts[idIndex + 1] : parts[0];
      
      // Force strip any tracking junk like /?igsh=...
      const id = rawId.split('?')[0].split('/')[0];
      
      const isReel = url.includes('/reels/') || url.includes('/reel/');
      const embedPath = isReel ? 'reel' : 'p';
      
      return {
        id,
        platform: 'instagram',
        embedUrl: `https://www.instagram.com/${embedPath}/${id}/embed/`,
        thumbnailUrl: '', 
        aspectRatio: isReel ? '9/16' : '1/1'
      };
    }

    // Facebook
    if (host.includes('facebook.com') || host.includes('fb.watch')) {
      return {
        id: url,
        platform: 'facebook',
        embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&width=500`,
        thumbnailUrl: '',
        aspectRatio: '16/9' // Default FB
      };
    }

    return null;
  } catch (e) {
    console.error('Invalid URL:', url);
    return null;
  }
};
