import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Trash2, Plus, LogOut } from 'lucide-react';
import styles from './App.module.css';
import { parseVideoUrl } from './utils/linkUtils';

import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase Dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

interface VideoCardProps {
  url: string;
  index: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ url, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const metadata = parseVideoUrl(url);

  if (!metadata) return null;

  const [width, height] = metadata.aspectRatio.split('/').map(Number);
  const paddingBottom = (height / width) * 100 + '%';

  return (
    <motion.div 
      className={styles.videoCard}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.05, ease: [0.215, 0.61, 0.355, 1] }}
      whileHover={{ y: -10, transition: { duration: 0.3 } }}
      onClick={() => setIsPlaying(true)}
    >
      <div 
        className={styles.thumbnailWrapper} 
        style={{ paddingBottom: paddingBottom }}
      >
        {!isPlaying ? (
          <>
            <motion.div
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.8 }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            >
              {metadata.thumbnailUrl ? (
                <img src={metadata.thumbnailUrl} alt="Video Thumbnail" className={styles.thumbnail} />
              ) : (
                <div className={styles.thumbnail} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  background: 'linear-gradient(45deg, #050505, #111)', 
                  color: '#fff' 
                }}>
                  <div style={{ opacity: 0.2, marginBottom: '1rem' }}>
                    <Play size={40} fill="white" />
                  </div>
                  <span style={{ fontSize: '0.6rem', letterSpacing: '0.3rem', fontWeight: 300, opacity: 0.5 }}>
                    VIEW {metadata.platform.toUpperCase()} PROJECT
                  </span>
                </div>
              )}
            </motion.div>
            
            <div className={styles.playOverlay} style={{ opacity: 1 }}>
              <Play size={20} fill="white" color="white" />
            </div>
            
            <div className={styles.platformTag}>{metadata.platform}</div>
          </>
        ) : (
          <div className={styles.iframeWrapper} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <iframe
              src={metadata.embedUrl}
              className={styles.iframe}
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              title={metadata.id}
              scrolling="no"
              style={{ border: 'none', overflow: 'hidden', width: '100%', height: '100%' }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const Dashboard: React.FC<{ links: string[], onSave: (links: string[]) => void, onBack: () => void }> = ({ links, onSave, onBack }) => {
  const [localLinks, setLocalLinks] = useState<string[]>(links);
  const [newLink, setNewLink] = useState('');
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleUnlock = () => {
    if (password === ADMIN_PASSWORD) {
      setIsUnlocked(true);
    } else {
      alert('Unauthorized access.');
    }
  };

  if (!isUnlocked) {
    return (
      <motion.div className={styles.dashboardContainer} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ textAlign: 'center', paddingTop: '10vh' }}>
          <h2 className={styles.adminTitle}>Security Required</h2>
          <div className={styles.inputGroup} style={{ maxWidth: '400px', margin: '2rem auto' }}>
            <input 
              type="password" 
              placeholder="Enter Admin Password" 
              className={styles.input} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <button onClick={handleUnlock} className={styles.addBtn}>Unlock</button>
          </div>
          <button onClick={onBack} className={styles.backBtn}>Cancel</button>
        </div>
      </motion.div>
    );
  }

  const addLink = () => {
    if (newLink) {
      setLocalLinks([...localLinks, newLink]);
      setNewLink('');
    }
  };

  const removeLink = (index: number) => {
    setLocalLinks(localLinks.filter((_, i) => i !== index));
  };

  return (
    <motion.div 
      className={styles.dashboardContainer}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.dashboardHeader}>
        <h2 className={styles.adminTitle}>Admin Portal</h2>
        <button onClick={onBack} className={styles.backBtn}>
          <LogOut size={16} style={{ marginRight: '10px' }} />
          Exit
        </button>
      </div>

      <div className={styles.inputGroup}>
        <input 
          type="text" 
          value={newLink} 
          onChange={(e) => setNewLink(e.target.value)} 
          placeholder="Enter project link (IG, YT, FB)..."
          className={styles.input}
        />
        <button onClick={addLink} className={styles.addBtn}>
          <Plus size={16} style={{ marginRight: '8px' }} />
          Add
        </button>
      </div>

      <div className={styles.linkList}>
        <AnimatePresence>
          {localLinks.map((link, index) => (
            <motion.div 
              key={index} 
              className={styles.linkItem}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
            >
              <span className={styles.linkUrl}>{link}</span>
              <button onClick={() => removeLink(index)} className={styles.deleteBtn}>
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ marginTop: '4rem', textAlign: 'right' }}>
        <button onClick={() => onSave(localLinks)} className={styles.saveBtn}>Save Database</button>
      </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const [links, setLinks] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase not configured');
      return;
    }
    
    const { data, error } = await supabase
      .from('projects')
      .select('url')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Fetch error:', error.message);
    } else if (data) {
      setLinks(data.map(p => p.url));
    }
  };

  const handleSave = async (updatedLinks: string[]) => {
    try {
      // 1. Delete all existing records
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .neq('id', 0); // Delete everything

      if (deleteError) throw deleteError;

      // 2. Insert new records
      if (updatedLinks.length > 0) {
        const { error: insertError } = await supabase
          .from('projects')
          .insert(updatedLinks.map(url => ({ url })));
        
        if (insertError) throw insertError;
      }
      
      setLinks(updatedLinks);
      setIsAdmin(false);
      alert('Portfolio Updated Successfully');
    } catch (err: any) {
      console.error('Save error:', err.message);
      alert('Failed to save: ' + (err.message || 'Unknown Error'));
    }
  };


  return (
    <>
      <div className={styles.bgCanvas}>
        <div className={styles.noise} />
      </div>

      <AnimatePresence mode="wait">
        {isAdmin ? (
          <Dashboard key="admin" links={links} onSave={handleSave} onBack={() => setIsAdmin(false)} />
        ) : (
          <motion.div 
            key="gallery"
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.header 
              className={styles.header}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
            >
              <motion.img 
                src="/logo.png" 
                alt="FOTONPHOTOS" 
                className={styles.logo} 
                onDoubleClick={() => setIsAdmin(true)}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              <p className={styles.subtitle}>Cinematography & Photography</p>
            </motion.header>

            <div className={styles.grid}>
              {links.map((link, index) => (
                <VideoCard key={index} url={link} index={index} />
              ))}
            </div>
            
            <footer 
              className={styles.footer} 
              onClick={() => setIsAdmin(true)}
              style={{ cursor: 'pointer' }}
            >
              © 2026 FOTONPHOTOS / BEYOND THE LENS
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
