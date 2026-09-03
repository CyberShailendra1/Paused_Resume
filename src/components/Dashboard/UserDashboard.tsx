import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, Plus, Copy, Trash2, Edit3, Download, TrendingUp, 
  CheckCircle2, FileText, Sparkles, User, LogIn, UserPlus, Cloud, CloudCheck, ExternalLink,
  LineChart, Lock, Globe, Shield, Share2
} from 'lucide-react';
import { SavedResumeVersion, ResumeData } from '../../types/resume';
import { 
  loadSavedVersions, 
  saveVersions, 
  duplicateVersion, 
  deleteVersion,
  toggleVersionPrivacy,
  fetchUserResumesFromCloud,
  syncResumeToCloud,
  deleteResumeFromCloud
} from '../../utils/resumeStorage';
import { exportResumeToPDF } from '../../utils/resumeExport';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../Auth/AuthModal';
import { ResumeScoreTrendChart } from './ResumeScoreTrendChart';

interface UserDashboardProps {
  onOpenVersion: (resumeData: ResumeData) => void;
  onCreateNew: () => void;
  onScanNew: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ 
  onOpenVersion, 
  onCreateNew, 
  onScanNew 
}) => {
  const { user, userProfile } = useAuth();
  const [versions, setVersions] = useState<SavedResumeVersion[]>([]);
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState<string>('');
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [authActionReason, setAuthActionReason] = useState<'download' | 'save' | 'general'>('general');
  const [pendingDownloadAction, setPendingDownloadAction] = useState<(() => void) | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [selectedTrendVersionId, setSelectedTrendVersionId] = useState<string>('');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'private' | 'public'>('all');

  const handleDownloadResume = (version: SavedResumeVersion) => {
    const isAuthenticated = !!(user && !user.isAnonymous);
    if (!isAuthenticated) {
      setAuthActionReason('download');
      setAuthModalMode('signup');
      setPendingDownloadAction(() => () => {
        exportResumeToPDF(version.resumeData, version.styleSettings);
      });
      setShowAuthModal(true);
      return;
    }
    exportResumeToPDF(version.resumeData, version.styleSettings);
  };

  const handleCreateShareLink = async (version: SavedResumeVersion) => {
    const payload = JSON.stringify({ resumeData: version.resumeData, styles: version.styleSettings });
    const encoded = window.btoa(unescape(encodeURIComponent(payload)));
    const shareUrl = `${window.location.origin}/share?data=${encodeURIComponent(encoded)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('View-only resume link copied to your clipboard.');
    } catch {
      window.prompt('Copy this view-only resume link:', shareUrl);
    }
  };

  // Synchronize default selectedTrendVersionId when versions load
  useEffect(() => {
    if (versions.length > 0) {
      setSelectedTrendVersionId(prev => {
        const stillExists = versions.some(v => v.id === prev);
        return stillExists && prev ? prev : versions[0].id;
      });
    }
  }, [versions]);

  const handleVersionUpdated = async (updated: SavedResumeVersion) => {
    const next = versions.map(v => v.id === updated.id ? updated : v);
    setVersions(next);
    saveVersions(next);
    if (user) {
      try {
        await syncResumeToCloud(user.uid, updated);
      } catch (err) {
        console.warn('Could not sync updated version to cloud:', err);
      }
    }
  };

  const handleTogglePrivacy = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = toggleVersionPrivacy(id);
    if (updated) {
      const all = loadSavedVersions();
      setVersions(all);
      if (user && !user.isAnonymous) {
        try {
          await syncResumeToCloud(user.uid, updated);
        } catch (err) {
          console.warn('Could not sync privacy to cloud:', err);
        }
      }
    }
  };

  useEffect(() => {
    // If user is logged in, fetch from Firestore cloud
    if (user && !user.isAnonymous) {
      setIsLoadingCloud(true);
      fetchUserResumesFromCloud(user.uid)
        .then((cloudVersions) => {
          if (cloudVersions && cloudVersions.length > 0) {
            setVersions(cloudVersions);
          } else {
            const local = loadSavedVersions();
            setVersions(local);
            // Sync local to cloud
            local.forEach(v => syncResumeToCloud(user.uid, v));
          }
        })
        .catch(() => {
          setVersions(loadSavedVersions());
        })
        .finally(() => {
          setIsLoadingCloud(false);
        });
    } else {
      setVersions(loadSavedVersions());
    }
  }, [user]);

  const handleDuplicate = async (id: string) => {
    const dup = duplicateVersion(id);
    if (dup) {
      const updated = loadSavedVersions();
      setVersions(updated);
      if (user) {
        await syncResumeToCloud(user.uid, dup);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this resume version?')) {
      const remaining = deleteVersion(id);
      setVersions(remaining);
      if (user) {
        await deleteResumeFromCloud(user.uid, id);
      }
    }
  };

  const handleSaveTitle = async (id: string) => {
    if (!editTitleValue.trim()) return;
    const updated = versions.map(v => {
      if (v.id === id) {
        const item = {
          ...v,
          title: editTitleValue.trim(),
          resumeData: { ...v.resumeData, name: editTitleValue.trim() }
        };
        if (user) {
          syncResumeToCloud(user.uid, item);
        }
        return item;
      }
      return v;
    });
    setVersions(updated);
    saveVersions(updated);
    setEditingTitleId(null);
  };

  const displayName = userProfile?.displayName || user?.displayName || (user?.isAnonymous ? 'Guest User' : 'Resume Professional');
  const displayEmail = userProfile?.email || user?.email || (user ? 'Authenticated Session' : 'Offline / Guest Mode');
  const userInitial = displayName ? displayName[0].toUpperCase() : 'U';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Auth Banner if not signed in */}
      {!user && (
        <div className="bg-linear-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-base font-bold">Never lose your tailored resumes</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Sign in or create a free account to back up your ATS resumes to the cloud, access versions across multiple devices, and sync revisions in real-time.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setAuthModalMode('signin');
                setShowAuthModal(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => {
                setAuthModalMode('signup');
                setShowAuthModal(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Free Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Profile Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={displayName} 
              className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-200 text-blue-600 flex items-center justify-center font-bold text-lg">
              {userInitial}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
              {user ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {user.isAnonymous ? 'Guest Account' : 'Cloud Synchronized'}
                </span>
              ) : (
                <button
                  onClick={() => {
                    setAuthModalMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                >
                  Local Mode • Click to Sign In
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{displayEmail}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onScanNew}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
          >
            Check Another Resume
          </button>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Resume</span>
          </button>
        </div>
      </div>

      {/* ATS Score Trend Visualizer Section */}
      {versions.length > 0 && (
        <div id="score-trend-chart">
          <ResumeScoreTrendChart
            versions={versions}
            selectedVersionId={selectedTrendVersionId || versions[0]?.id}
            onSelectVersionId={(id) => setSelectedTrendVersionId(id)}
            onOpenInBuilder={onOpenVersion}
            onVersionUpdated={handleVersionUpdated}
          />
        </div>
      )}

      {/* Saved Versions Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-blue-600" />
              Saved Resume Versions ({versions.length})
            </h3>
            <p className="text-xs text-slate-500">
              Manage tailored versions for different applications. Mark confidential revisions as Private to keep them safeguarded.
            </p>
          </div>

          {/* Privacy Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setPrivacyFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                privacyFilter === 'all' 
                  ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({versions.length})
            </button>
            <button
              type="button"
              onClick={() => setPrivacyFilter('private')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                privacyFilter === 'private' 
                  ? 'bg-white text-purple-800 font-bold shadow-2xs' 
                  : 'text-slate-600 hover:text-purple-700'
              }`}
              title="Filter to private saved versions only"
            >
              <Lock className="w-3 h-3 text-purple-600" />
              <span>Private ({versions.filter(v => v.isPrivate).length})</span>
            </button>
            <button
              type="button"
              onClick={() => setPrivacyFilter('public')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                privacyFilter === 'public' 
                  ? 'bg-white text-blue-800 font-bold shadow-2xs' 
                  : 'text-slate-600 hover:text-blue-700'
              }`}
              title="Filter to standard public versions only"
            >
              <Globe className="w-3 h-3 text-slate-500" />
              <span>Standard ({versions.filter(v => !v.isPrivate).length})</span>
            </button>
          </div>
        </div>

        {/* Empty filter state */}
        {versions.filter(v => {
          if (privacyFilter === 'private') return v.isPrivate;
          if (privacyFilter === 'public') return !v.isPrivate;
          return true;
        }).length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <Lock className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No {privacyFilter} versions found</div>
            <p className="text-xs text-slate-400">
              {privacyFilter === 'private' 
                ? 'Click the lock icon on any resume card below to mark it as a Private saved version.' 
                : 'All your resumes are currently marked as Private.'}
            </p>
            <button
              type="button"
              onClick={() => setPrivacyFilter('all')}
              className="mt-2 text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
            >
              Show all versions
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {versions
            .filter(v => {
              if (privacyFilter === 'private') return v.isPrivate;
              if (privacyFilter === 'public') return !v.isPrivate;
              return true;
            })
            .map((ver) => {
            const score = ver.lastScore || 85;
            const scoreBg = score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            score >= 65 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200';
            const isTrendSelected = (selectedTrendVersionId || versions[0]?.id) === ver.id;

            return (
              <div 
                key={ver.id}
                className={`bg-white rounded-2xl border transition-all group flex flex-col justify-between p-5 ${
                  isTrendSelected 
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md' 
                    : ver.isPrivate
                    ? 'border-purple-200/90 hover:border-purple-300 bg-purple-50/15 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div>
                  
                  {/* Top Bar with Score Badge & Privacy Flag */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Updated {new Date(ver.updatedAt).toLocaleDateString()}
                      </span>
                      {/* Privacy Status Badge & Quick Toggle */}
                      <button
                        type="button"
                        onClick={(e) => handleTogglePrivacy(ver.id, e)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                          ver.isPrivate 
                            ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 shadow-2xs' 
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={ver.isPrivate ? "Private Saved Version (Confidential) - Click to make Standard" : "Standard Version - Click to make Private"}
                      >
                        {ver.isPrivate ? (
                          <>
                            <Lock className="w-2.5 h-2.5 text-purple-700" />
                            <span>Private</span>
                          </>
                        ) : (
                          <>
                            <Globe className="w-2.5 h-2.5 text-slate-400" />
                            <span>Standard</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isTrendSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <TrendingUp className="w-2.5 h-2.5" />
                          Plotted
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTrendVersionId(ver.id);
                          document.getElementById('score-trend-chart')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border transition-transform hover:scale-105 ${scoreBg}`}
                        title="Click to view ATS Score Trend above"
                      >
                        ATS Score: {score}
                      </button>
                    </div>
                  </div>

                  {/* Title (Editable) */}
                  {editingTitleId === ver.id ? (
                    <div className="flex items-center gap-1 mb-2">
                      <input
                        type="text"
                        value={editTitleValue}
                        onChange={(e) => setEditTitleValue(e.target.value)}
                        className="text-sm font-bold px-2 py-1 border rounded w-full"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleSaveTitle(ver.id)} 
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded font-medium"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <h4 
                      onClick={() => onOpenVersion(ver.resumeData)}
                      className="font-bold text-slate-900 text-base hover:text-blue-600 cursor-pointer transition-colors line-clamp-1 mb-1"
                    >
                      {ver.title}
                    </h4>
                  )}

                  <p className="text-xs text-slate-500 line-clamp-1">
                    {ver.resumeData.contact.jobTitle || 'General Professional'} • {ver.resumeData.sections.length} Sections
                  </p>

                  {/* Score Trend Mini Graph */}
                  {ver.scoreHistory && ver.scoreHistory.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTrendVersionId(ver.id);
                        document.getElementById('score-trend-chart')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 hover:bg-slate-50/80 -mx-1 px-1 rounded transition-colors text-left"
                      title="Click to open trend chart for this version"
                    >
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Score history ({ver.scoreHistory.length} edits):
                      </span>
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        {ver.scoreHistory.slice(-4).map((h, hIdx) => (
                          <span key={hIdx} className="px-1.5 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                            {h.score}
                          </span>
                        ))}
                      </div>
                    </button>
                  )}

                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenVersion(ver.resumeData)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Builder</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTrendVersionId(ver.id);
                        document.getElementById('score-trend-chart')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isTrendSelected 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Plot ATS score change trend"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Trend</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle Privacy */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePrivacy(ver.id, e)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        ver.isPrivate 
                          ? 'text-purple-700 bg-purple-100/80 hover:bg-purple-200 border border-purple-300 shadow-2xs' 
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={ver.isPrivate ? "Private version - Click to make standard" : "Make saved version Private"}
                    >
                      {ver.isPrivate ? (
                        <Lock className="w-3.5 h-3.5" />
                      ) : (
                        <Globe className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(ver.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Duplicate version"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Download PDF */}
                    <button
                      onClick={() => handleDownloadResume(ver)}
                      className={`p-1.5 rounded-lg transition-colors relative ${
                        !(user && !user.isAnonymous)
                          ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                          : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      title={!(user && !user.isAnonymous) ? "Sign in / Sign up to download ATS PDF" : "Export ATS PDF"}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleCreateShareLink(ver)}
                      className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Copy view-only share link"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    {versions.length > 1 && (
                      <button
                        onClick={() => handleDelete(ver.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete version"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingDownloadAction(null);
          setAuthActionReason('general');
        }}
        initialMode={authModalMode}
        actionReason={authActionReason}
        onSuccess={() => {
          if (pendingDownloadAction) {
            pendingDownloadAction();
            setPendingDownloadAction(null);
          }
        }}
      />

    </div>
  );
};
