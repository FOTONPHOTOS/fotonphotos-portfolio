import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Play, Trash2, Plus, LogOut, GripVertical, LayoutGrid, List, Image as ImageIcon, MoreVertical, Edit2, Copy, Check, X, Upload } from 'lucide-react';
import styles from './App.module.css';
import { parseVideoUrl } from './utils/linkUtils';

import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase Dashboard
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

interface Project {
  id?: number;
  url: string;
  thumbnail_url?: string;
  aspect_ratio: string;
  created_at?: string;
}

interface VideoCardProps {
  project: Project;
  index: number;
}

const VideoCard: React.FC<VideoCardProps> = ({ project, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const metadata = parseVideoUrl(project.url);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!metadata) return null;

  const ratio = project.aspect_ratio || '9/16';
  const [width, height] = ratio.split('/').map(Number);
  const paddingBottom = (height / width) * 100 + '%';

  const isYouTube = metadata.platform === 'youtube';
  const isDrive = project.url.includes('drive.google.com');
  const displayThumbnail = project.thumbnail_url || metadata.thumbnailUrl;

  // For IG and FB, we show the embed immediately as a "Live Thumbnail"
  const showEmbedImmediately = metadata.platform === 'instagram' || metadata.platform === 'facebook';

  const driveDirectUrl = isDrive ? `https://drive.google.com/uc?export=download&id=${metadata.id}` : '';

  const handlePlay = () => {
    setIsPlaying(true);
    if (isDrive && videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <motion.div 
      className={styles.videoCard}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: index * 0.05 }}
      whileHover={{ y: -10 }}
      onClick={handlePlay}
    >
      <div className={styles.thumbnailWrapper} style={{ paddingBottom: paddingBottom }}>
        {(!isPlaying && !showEmbedImmediately) ? (
          <>
            <motion.div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
              {displayThumbnail ? (
                <img src={displayThumbnail} alt="" className={styles.thumbnail} />
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
            <div className={styles.platformTag}>{isDrive ? 'DRIVE' : metadata.platform}</div>
          </>
        ) : (
          <div className={styles.iframeWrapper} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            {isDrive ? (
              <video 
                ref={videoRef}
                src={driveDirectUrl}
                controls
                autoPlay
                className={styles.iframe}
                style={{ objectFit: 'contain', background: '#000' }}
                poster={displayThumbnail}
              />
            ) : (
              <iframe
                src={metadata.embedUrl + (isPlaying ? "?autoplay=1" : "")}
                className={styles.iframe}
                allow="autoplay; encrypted-media"
                allowFullScreen
                scrolling="no"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const Dashboard: React.FC<{ projects: Project[], onSave: (projects: Project[]) => void, onBack: () => void }> = ({ projects, onSave, onBack }) => {
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [newUrl, setNewUrl] = useState('');
  const [newThumb, setNewThumb] = useState('');
  const [newRatio, setNewRatio] = useState('9/16');
  const [uploading, setUploading] = useState(false);
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeMenu, setEditingMenu] = useState<number | null>(null);

  const handleUnlock = () => {
    if (password === ADMIN_PASSWORD) setIsUnlocked(true);
    else alert('Unauthorized access.');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase) return alert('Supabase client not initialized');
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('portfolio').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('portfolio').getPublicUrl(filePath);
      setNewThumb(data.publicUrl);
      alert('Thumbnail Uploaded Successfully');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const addProject = () => {
    if (newUrl) {
      const newProj: Project = { url: newUrl, thumbnail_url: newThumb, aspect_ratio: newRatio };
      setLocalProjects([newProj, ...localProjects]);
      setNewUrl(''); setNewThumb('');
    }
  };

  const handleEdit = (index: number) => {
    const proj = localProjects[index];
    setNewUrl(proj.url);
    setNewThumb(proj.thumbnail_url || '');
    setNewRatio(proj.aspect_ratio || '9/16');
    setEditingIndex(index);
    setEditingMenu(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateProject = () => {
    if (editingIndex !== null) {
      const updated = [...localProjects];
      updated[editingIndex] = { ...updated[editingIndex], url: newUrl, thumbnail_url: newThumb, aspect_ratio: newRatio };
      setLocalProjects(updated);
      setEditingIndex(null);
      setNewUrl(''); setNewThumb('');
    }
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
        <h2 className={styles.adminTitle}>{editingIndex !== null ? 'Edit Project' : 'Admin Portal'}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className={styles.backBtn}>
            {viewMode === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}
            <span style={{ marginLeft: '8px' }}>{viewMode === 'grid' ? 'Edit Order' : 'Back to Grid'}</span>
          </button>
          <button onClick={onBack} className={styles.backBtn}><LogOut size={16} /></button>
        </div>
      </div>

      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '4rem' }}>
        <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
          <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="Video Link (IG, YT, FB, Drive)..." className={styles.input} />
        </div>
        <div className={styles.inputGroup} style={{ marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <ImageIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
            <input type="text" value={newThumb} onChange={(e) => setNewThumb(e.target.value)} placeholder="Thumbnail URL" className={styles.input} style={{ paddingLeft: '3rem' }} />
          </div>
          <label className={styles.addBtn} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}>
            <Upload size={16} /> {uploading ? '...' : 'Upload'}
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
          </label>
          <select value={newRatio} onChange={(e) => setNewRatio(e.target.value)} className={styles.input} style={{ flex: '0 0 150px', cursor: 'pointer' }}>
            <option value="9/16">Portrait (9:16)</option>
            <option value="16/9">Landscape (16:9)</option>
            <option value="1/1">Square (1:1)</option>
          </select>
        </div>
        {editingIndex !== null ? (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={updateProject} className={styles.addBtn} style={{ flex: 1, background: '#fff', color: '#000' }}><Check size={16} style={{ marginRight: '8px' }} /> Update Project</button>
            <button onClick={() => { setEditingIndex(null); setNewUrl(''); setNewThumb(''); }} className={styles.backBtn} style={{ flex: 1 }}><X size={16} style={{ marginRight: '8px' }} /> Cancel Edit</button>
          </div>
        ) : (
          <button onClick={addProject} className={styles.addBtn} style={{ width: '100%', marginTop: '1rem' }}><Plus size={16} style={{ marginRight: '8px' }} /> Add to Portfolio</button>
        )}
      </div>

      {viewMode === 'grid' ? (
        <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {localProjects.map((proj, i) => {
            const meta = parseVideoUrl(proj.url);
            const thumb = proj.thumbnail_url || meta?.thumbnailUrl;
            const isYouTube = meta?.platform === 'youtube';
            return (
              <div key={proj.url + i} className={styles.videoCard} style={{ border: '1px solid rgba(255,255,255,0.05)', background: '#050505' }}>
                <div className={styles.thumbnailWrapper} style={{ paddingBottom: (proj.aspect_ratio || '9/16') === '9/16' ? '177.77%' : '56.25%' }}>
                  {(thumb && isYouTube) ? (
                    <img src={thumb} className={styles.thumbnail} style={{ opacity: 0.5 }} alt="" />
                  ) : (
                    <div className={styles.iframeWrapper}>
                      <iframe src={meta?.embedUrl} style={{ width: '100%', height: '100%', border: 'none', transform: 'scale(1)', opacity: 0.4 }} scrolling="no" />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 20 }}>
                    <button onClick={(e) => { e.stopPropagation(); setEditingMenu(activeMenu === i ? null : i); }} style={{ background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '4px', width: '30px', height: '30px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MoreVertical size={16} /></button>
                    <AnimatePresence>
                      {activeMenu === i && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: 'absolute', top: '35px', right: 0, background: '#111', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden', minWidth: '120px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                          <button onClick={() => handleEdit(i)} style={{ width: '100%', padding: '0.8rem 1rem', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><Edit2 size={12} /> Edit</button>
                          <button onClick={() => { navigator.clipboard.writeText(proj.url); alert('Copied'); setEditingMenu(null); }} style={{ width: '100%', padding: '0.8rem 1rem', background: 'transparent', border: 'none', color: '#fff', textAlign: 'left', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><Copy size={12} /> Copy Link</button>
                          <button onClick={() => { if(window.confirm('Security Check: Are you sure?')) setLocalProjects(localProjects.filter((_, idx) => idx !== i)); setEditingMenu(null); }} style={{ width: '100%', padding: '0.8rem 1rem', background: 'transparent', border: 'none', color: '#ff4444', textAlign: 'left', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}><Trash2 size={12} /> Delete</button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className={styles.platformTag} style={{ top: '10px', left: '10px', right: 'auto' }}>{proj.aspect_ratio || '9/16'}</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Reorder.Group axis="y" values={localProjects} onReorder={setLocalProjects} className={styles.linkList}>
            {localProjects.map((proj, i) => {
              const meta = parseVideoUrl(proj.url);
              const thumb = proj.thumbnail_url || meta?.thumbnailUrl;
              const isYouTube = meta?.platform === 'youtube';
              return (
                <Reorder.Item key={proj.url + i} value={proj} className={styles.linkItem} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem', cursor: 'grab' }}>
                  <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '1.5rem', padding: '0.5rem' }}>
                    <GripVertical size={16} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <div style={{ width: '60px', height: '60px', background: '#000', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                      {(thumb && isYouTube) ? (
                        <img src={thumb} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} alt="" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
                           <iframe src={meta?.embedUrl} style={{ width: '200%', height: '200%', border: 'none', transform: 'scale(0.5)', transformOrigin: 'top left', opacity: 0.4 }} scrolling="no" />
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.url}</div>
                      <div style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>RATIO: {proj.aspect_ratio || '9/16'}</div>
                    </div>
                    <button onClick={() => handleEdit(i)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><Edit2 size={14} /></button>
                    <button onClick={() => { if(window.confirm('Security Check: Are you sure?')) setLocalProjects(localProjects.filter((_, idx) => idx !== i)); }} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        </div>
      )}

      <div style={{ marginTop: '4rem', textAlign: 'center', paddingBottom: '10rem' }}>
        <button onClick={() => onSave(localProjects)} className={styles.saveBtn} style={{ padding: '1.2rem 4rem', fontSize: '1rem' }}>Save Portfolio Configuration</button>
      </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => { fetchLinks(); }, []);

  const fetchLinks = async () => {
    if (!supabase) {
      console.warn('Supabase not configured');
      return;
    }
    const { data, error } = await supabase.from('portfolio_projects').select('*').order('created_at', { ascending: false });
    if (error) console.error('Fetch error:', error.message);
    if (data) setProjects(data);
  };

  const handleSave = async (updatedProjects: Project[]) => {
    if (!supabase) return alert('Supabase client not initialized');
    try {
      const uniqueProjects = Array.from(new Set(updatedProjects.map(p => p.url)))
        .map(url => updatedProjects.find(p => p.url === url)!);

      await supabase.from('portfolio_projects').delete().neq('id', 0);
      if (uniqueProjects.length > 0) {
        const insertData = uniqueProjects.map((p, i) => ({ 
          url: p.url,
          thumbnail_url: p.thumbnail_url,
          aspect_ratio: p.aspect_ratio || '9/16',
          created_at: new Date(Date.now() - i * 1000).toISOString() 
        }));
        await supabase.from('portfolio_projects').insert(insertData);
      }
      setProjects(uniqueProjects);
      setIsAdmin(false);
      alert('Portfolio Updated Successfully');
    } catch (err: any) { alert('Save error: ' + err.message); }
  };

  return (
    <>
      <div className={styles.bgCanvas}><div className={styles.noise} /></div>
      <AnimatePresence mode="wait">
        {isAdmin ? (
          <Dashboard key="admin" projects={projects} onSave={handleSave} onBack={() => setIsAdmin(false)} />
        ) : (
          <motion.div key="gallery" className={styles.container} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.header 
              className={styles.header}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              style={{ marginTop: '-2rem' }}
            >
              <motion.img 
                src="/logo.png" 
                alt="FOTONPHOTOS" 
                className={styles.logo} 
                onDoubleClick={() => setIsAdmin(true)}
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ 
                  y: 0, opacity: 1, scale: 1,
                  filter: [
                    'drop-shadow(0 0 10px rgba(255,255,255,0.1))',
                    'drop-shadow(0 0 20px rgba(255,255,255,0.2))',
                    'drop-shadow(0 0 10px rgba(255,255,255,0.1))'
                  ]
                }}
                transition={{ 
                  duration: 1.2, filter: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                }}
                whileHover={{ scale: 1.05 }}
              />
              <motion.p className={styles.subtitle} initial={{ opacity: 0, letterSpacing: '0.4rem' }} animate={{ opacity: 1, letterSpacing: '0.8rem' }} transition={{ duration: 2, delay: 0.5 }}>
                Cinematography & Photography
              </motion.p>
            </motion.header>
            
            {projects.length === 0 && (
              <div style={{ textAlign: 'center', opacity: 0.2, marginTop: '10vh' }}>
                <p style={{ letterSpacing: '0.5rem', textTransform: 'uppercase' }}>No projects loaded.</p>
                <p style={{ fontSize: '0.6rem' }}>Check Vercel Environment Variables.</p>
              </div>
            )}

            <div className={styles.grid}>
              {projects.map((proj, index) => <VideoCard key={proj.url + index} project={proj} index={index} />)}
            </div>
            <footer className={styles.footer} onClick={() => setIsAdmin(true)} style={{ cursor: 'pointer' }}>© 2026 FOTONPHOTOS / BEYOND THE LENS</footer>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default App;
