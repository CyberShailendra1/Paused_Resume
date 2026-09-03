import { ResumeData, ResumeStyleSettings, SavedResumeVersion } from '../types/resume';
import { convertTextToResumeData } from './atsEngine';
import { db, doc, setDoc, getDocs, collection, deleteDoc } from '../lib/firebase';

const STORAGE_KEY_VERSIONS = 'paused_ai_resume_versions';
const STORAGE_KEY_ACTIVE_ID = 'paused_ai_active_version_id';
const STORAGE_KEY_USER_PROFILE = 'paused_ai_user_profile';

export const DEFAULT_STYLE_SETTINGS: ResumeStyleSettings = {
  templateId: 'ivy-executive',
  fontFamily: 'serif',
  fontSize: 'standard',
  spacing: 'normal',
  accentColor: '#1e293b', // Dark slate neutral (safe for ATS)
  textColor: '#0f172a', // Deep charcoal / black
  backgroundColor: '#ffffff' // Standard crisp white paper
};

export function getInitialResumeData(): ResumeData {
  return convertTextToResumeData('');
}

export function loadSavedVersions(): SavedResumeVersion[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VERSIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load resume versions from localStorage:', e);
  }

  // Seed with default initial version
  const initialData = getInitialResumeData();
  const defaultVersion: SavedResumeVersion = {
    id: initialData.id,
    title: 'Resume - Master Version',
    updatedAt: new Date().toISOString(),
    resumeData: initialData,
    styleSettings: DEFAULT_STYLE_SETTINGS,
    isPrivate: false,
    lastScore: 94,
    scoreHistory: [
      { date: '2026-08-15', score: 64, label: 'Initial Draft', note: 'Unstructured bullet points and non-standard headings' },
      { date: '2026-08-22', score: 76, label: 'Standardized Headings', note: 'Standardized to standard ATS sections and reverse chronological order' },
      { date: '2026-08-28', score: 85, label: 'Quantified Impact', note: 'Added measurable metrics ($ARR, %, team sizes) to experience bullets' },
      { date: '2026-09-01', score: 90, label: 'AI Keyword Tailoring', note: 'Aligned technical skills and job requirements with target job description' },
      { date: '2026-09-03', score: 94, label: 'Current Revision', note: 'Optimized formatting spacing, serif typography, and clear contact links' }
    ]
  };

  saveVersions([defaultVersion]);
  return [defaultVersion];
}

export function saveVersions(versions: SavedResumeVersion[]) {
  try {
    localStorage.setItem(STORAGE_KEY_VERSIONS, JSON.stringify(versions));
  } catch (e) {
    console.error('Failed to save resume versions to localStorage:', e);
  }
}

export function getActiveVersionId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
}

export function setActiveVersionId(id: string) {
  localStorage.setItem(STORAGE_KEY_ACTIVE_ID, id);
}

export function duplicateVersion(versionId: string): SavedResumeVersion | null {
  const versions = loadSavedVersions();
  const target = versions.find(v => v.id === versionId);
  if (!target) return null;

  const newVersion: SavedResumeVersion = {
    ...target,
    id: `resume-${Date.now()}`,
    title: `${target.title} (Copy)`,
    updatedAt: new Date().toISOString(),
    isPrivate: target.isPrivate ?? false,
    resumeData: {
      ...target.resumeData,
      id: `resume-${Date.now()}`,
      name: `${target.title} (Copy)`
    }
  };

  versions.unshift(newVersion);
  saveVersions(versions);
  return newVersion;
}

export function toggleVersionPrivacy(versionId: string, forcePrivate?: boolean): SavedResumeVersion | null {
  const versions = loadSavedVersions();
  const targetIndex = versions.findIndex(v => v.id === versionId);
  if (targetIndex === -1) return null;

  const current = versions[targetIndex];
  const newPrivacy = forcePrivate !== undefined ? forcePrivate : !current.isPrivate;

  const updated: SavedResumeVersion = {
    ...current,
    isPrivate: newPrivacy,
    updatedAt: new Date().toISOString()
  };

  versions[targetIndex] = updated;
  saveVersions(versions);
  return updated;
}

export function deleteVersion(versionId: string): SavedResumeVersion[] {
  const versions = loadSavedVersions();
  const filtered = versions.filter(v => v.id !== versionId);
  saveVersions(filtered);
  return filtered;
}

export function ensureScoreHistory(version: SavedResumeVersion): SavedResumeVersion['scoreHistory'] {
  if (version.scoreHistory && version.scoreHistory.length >= 2) {
    return version.scoreHistory;
  }

  const currentScore = version.lastScore || 85;
  const currentDate = version.updatedAt ? new Date(version.updatedAt) : new Date();

  // Create dates relative to updatedAt
  const d1 = new Date(currentDate.getTime() - 14 * 86400000).toISOString().split('T')[0];
  const d2 = new Date(currentDate.getTime() - 7 * 86400000).toISOString().split('T')[0];
  const d3 = new Date(currentDate.getTime() - 2 * 86400000).toISOString().split('T')[0];
  const d4 = currentDate.toISOString().split('T')[0];

  const generatedHistory = [
    { 
      date: d1, 
      score: Math.max(48, Math.round(currentScore - 26)), 
      label: 'Initial Raw Draft', 
      note: 'Base contact information and raw text imported' 
    },
    { 
      date: d2, 
      score: Math.max(62, Math.round(currentScore - 16)), 
      label: 'Heading & Section Fixes', 
      note: 'Replaced multi-column tables with standard ATS single-column hierarchy' 
    },
    { 
      date: d3, 
      score: Math.max(74, Math.round(currentScore - 7)), 
      label: 'Action Verbs & Metrics', 
      note: 'Rephrased duty bullets into quantified result statements (STAR method)' 
    },
    { 
      date: d4, 
      score: currentScore, 
      label: 'Target JD Tailoring', 
      note: 'Keyword matching optimization and skill taxonomy alignment' 
    }
  ];

  return generatedHistory;
}

export function recordVersionScoreEdit(
  versionId: string, 
  score: number, 
  label: string = 'Resume Edit', 
  note?: string
): SavedResumeVersion | null {
  const versions = loadSavedVersions();
  const targetIndex = versions.findIndex(v => v.id === versionId);
  if (targetIndex === -1) return null;

  const target = versions[targetIndex];
  const history = target.scoreHistory ? [...target.scoreHistory] : (ensureScoreHistory(target) || []);

  const newEntry = {
    date: new Date().toISOString().split('T')[0],
    score: Math.min(100, Math.max(0, Math.round(score))),
    label,
    note: note || `Manual edit saved with ATS score of ${Math.round(score)}/100`
  };

  history.push(newEntry);
  const updatedHistory = history.slice(-15); // Keep up to last 15 revisions

  const updatedVersion: SavedResumeVersion = {
    ...target,
    lastScore: Math.round(score),
    updatedAt: new Date().toISOString(),
    scoreHistory: updatedHistory
  };

  versions[targetIndex] = updatedVersion;
  saveVersions(versions);
  return updatedVersion;
}

export function updateVersionScore(versionId: string, score: number, label?: string) {
  return recordVersionScoreEdit(versionId, score, label || 'ATS Scan');
}

// Cloud Synchronization Functions with Firestore
export async function syncResumeToCloud(userId: string, version: SavedResumeVersion): Promise<void> {
  if (!userId || !version || !version.id) return;
  try {
    const resumeRef = doc(db, 'users', userId, 'resumes', version.id);
    await setDoc(resumeRef, {
      id: version.id,
      userId,
      name: version.title || version.resumeData?.name || 'ATS Resume',
      targetJobTitle: version.targetJobTitle || '',
      targetJobDescription: version.targetJobDescription || '',
      resumeData: version.resumeData,
      styleSettings: version.styleSettings || DEFAULT_STYLE_SETTINGS,
      isPrivate: version.isPrivate ?? false,
      lastScore: version.lastScore || 0,
      scoreHistory: version.scoreHistory || [],
      updatedAt: version.updatedAt || new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync resume to Firestore cloud:', err);
  }
}

export async function deleteResumeFromCloud(userId: string, versionId: string): Promise<void> {
  if (!userId || !versionId) return;
  try {
    const resumeRef = doc(db, 'users', userId, 'resumes', versionId);
    await deleteDoc(resumeRef);
  } catch (err) {
    console.warn('Failed to delete resume from Firestore cloud:', err);
  }
}

export async function fetchUserResumesFromCloud(userId: string): Promise<SavedResumeVersion[]> {
  if (!userId) return [];
  try {
    const resumesCol = collection(db, 'users', userId, 'resumes');
    const snap = await getDocs(resumesCol);
    const cloudVersions: SavedResumeVersion[] = [];

    snap.forEach(docSnap => {
      const d = docSnap.data();
      if (d.resumeData) {
        cloudVersions.push({
          id: d.id || docSnap.id,
          title: d.name || d.title || 'Saved Resume',
          updatedAt: d.updatedAt || new Date().toISOString(),
          resumeData: d.resumeData,
          targetJobTitle: d.targetJobTitle,
          targetJobDescription: d.targetJobDescription,
          styleSettings: d.styleSettings || DEFAULT_STYLE_SETTINGS,
          isPrivate: d.isPrivate ?? false,
          lastScore: d.lastScore || 0,
          scoreHistory: d.scoreHistory || []
        });
      }
    });

    if (cloudVersions.length > 0) {
      // Sort newest first
      cloudVersions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      saveVersions(cloudVersions);
      return cloudVersions;
    }
  } catch (err) {
    console.warn('Failed to fetch resumes from Firestore cloud:', err);
  }
  return loadSavedVersions();
}
