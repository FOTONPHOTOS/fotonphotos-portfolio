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
        thumbnailUrl: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
        aspectRatio: isShort ? '9/16' : '16/9'
      };
    }

    // Instagram
    if (host.includes('instagram.com')) {
      // Extract post ID
      const parts = urlObj.pathname.split('/').filter(p => p);
      const id = parts[1] || parts[0]; // e.g., /reels/ID/ or /p/ID/
      const isReel = url.includes('/reels/') || url.includes('/reel/');
      
      return {
        id,
        platform: 'instagram',
        embedUrl: `https://www.instagram.com/p/${id}/embed/`,
        thumbnailUrl: '', // IG blocks direct thumb access without API
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
