import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Play, Trash2, Plus, LogOut, GripVertical, LayoutGrid, List } from 'lucide-react';
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
      transition={{ duration: 0.8, delay: index * 0.05 }}
      whileHover={{ y: -10 }}
      onClick={() => setIsPlaying(true)}
    >
      <div className={styles.thumbnailWrapper} style={{ paddingBottom: paddingBottom }}>
        {!isPlaying ? (
          <>
            <motion.div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              {metadata.thumbnailUrl ? (
                <img src={metadata.thumbnailUrl} alt="" className={styles.thumbnail} />
              ) : (
                <div className={styles.thumbnail} style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  background: 'linear-gradient(45deg, #050505, #111)', color: '#fff' 
                }}>
                  <Play size={30} fill="white" style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.5rem', letterSpacing: '0.2rem', opacity: 0.5 }}>PREVIEW</span>
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
              allow="autoplay; encrypted-media"
              allowFullScreen
              scrolling="no"
              style={{ width: '100%', height: '100%', border: 'none' }}
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleUnlock = () => {
    if (password === ADMIN_PASSWORD) setIsUnlocked(true);
    else alert('Unauthorized access.');
  };

  if (!isUnlocked) {
    return (
      <div className={styles.dashboardContainer}>
        <div style={{ textAlign: 'center', paddingTop: '10vh' }}>
          <h2 className={styles.adminTitle}>Security Required</h2>
          <div className={styles.inputGroup} style={{ maxWidth: '400px', margin: '2rem auto' }}>
            <input type="password" placeholder="Password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUnlock()} />
            <button onClick={handleUnlock} className={styles.addBtn}>Unlock</button>
          </div>
          <button onClick={onBack} className={styles.backBtn}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div className={styles.dashboardContainer} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '1200px' }}>
      <div className={styles.dashboardHeader}>
        <h2 className={styles.adminTitle}>Admin Portal</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className={styles.backBtn}>
            {viewMode === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
            <span style={{ marginLeft: '8px' }}>{viewMode === 'grid' ? 'List View' : 'Grid View'}</span>
          </button>
          <button onClick={onBack} className={styles.backBtn}><LogOut size={16} /></button>
        </div>
      </div>

      <div className={styles.inputGroup} style={{ marginBottom: '4rem' }}>
        <input type="text" value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="Paste link..." className={styles.input} />
        <button onClick={() => { if(newLink) { setLocalLinks([newLink, ...localLinks]); setNewLink(''); }}} className={styles.addBtn}><Plus size={16} /> Add</button>
      </div>

      {viewMode === 'grid' ? (
        <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {localLinks.map((link, i) => {
            const meta = parseVideoUrl(link);
            return (
              <div key={link + i} className={styles.videoCard} style={{ border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className={styles.thumbnailWrapper} style={{ paddingBottom: meta?.aspectRatio === '9/16' ? '177%' : '56.25%' }}>
                  <img src={meta?.thumbnailUrl || ''} className={styles.thumbnail} style={{ opacity: 0.3 }} alt="" />
                  <button onClick={() => setLocalLinks(localLinks.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '5px', right: '5px', background: '#ff4444', border: 'none', borderRadius: '50%', width: '24px', height: '24px', color: 'white', zIndex: 10 }}><Trash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Reorder.Group axis="y" values={localLinks} onReorder={setLocalLinks} className={styles.linkList}>
          {localLinks.map((link, i) => {
            const meta = parseVideoUrl(link);
            return (
              <Reorder.Item key={link} value={link} className={styles.linkItem} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem', cursor: 'grab' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1.5rem' }}>
                  <GripVertical size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <div style={{ width: '80px', height: '45px', background: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                    <img src={meta?.thumbnailUrl || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="" />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{link}</span>
                  <button onClick={() => setLocalLinks(localLinks.filter((_, idx) => idx !== i))} style={{ background: 'transparent', border: 'none', color: '#ff4444' }}><Trash2 size={14} /></button>
                </div>
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      )}

      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <button onClick={() => onSave(localLinks)} className={styles.saveBtn} style={{ padding: '1rem 3rem' }}>Save Arrangement</button>
      </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const [links, setLinks] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { fetchLinks(); }, []);

  const fetchLinks = async () => {
    if (!supabaseUrl || !supabaseKey) return;
    const { data } = await supabase.from('projects').select('url').order('created_at', { ascending: false });
    if (data) setLinks(data.map(p => p.url));
  };

  const handleSave = async (updatedLinks: string[]) => {
    try {
      await supabase.from('projects').delete().neq('id', 0);
      if (updatedLinks.length > 0) await supabase.from('projects').insert(updatedLinks.map((url, i) => ({ url, created_at: new Date(Date.now() - i * 1000).toISOString() })));
      setLinks(updatedLinks);
      setIsAdmin(false);
      alert('Portfolio Updated');
    } catch (err: any) { alert('Save error'); }
  };

  return (
    <>
      <div className={styles.bgCanvas}><div className={styles.noise} /></div>
      <AnimatePresence mode="wait">
        {isAdmin ? <Dashboard links={links} onSave={handleSave} onBack={() => setIsAdmin(false)} /> : (
          <motion.div className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <header className={styles.header}>
              <motion.img src="/logo.png" alt="FOTONPHOTOS" className={styles.logo} onDoubleClick={() => setIsAdmin(true)} whileHover={{ scale: 1.02 }} />
              <p className={styles.subtitle}>Cinematography & Photography</p>
            </header>
            <div className={styles.grid}>
              {links.map((link, index) => <VideoCard key={link + index} url={link} index={index} />)}
            </div>
            <footer className={styles.footer} onClick={() => setIsAdmin(true)} style={{ cursor: 'pointer' }}>© 2026 FOTONPHOTOS / BEYOND THE LENS</footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
