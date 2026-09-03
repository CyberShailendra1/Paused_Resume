import React, { useState, useRef, useEffect } from 'react';
import { 
  LogIn, UserPlus, LogOut, User as UserIcon, Cloud, CloudCheck, 
  ChevronDown, FolderKanban, ShieldCheck, Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from './AuthModal';

interface UserMenuProps {
  onNavigateToDashboard?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ onNavigateToDashboard }) => {
  const { user, userProfile, logout, loading } = useAuth();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'signin' | 'signup'>('signin');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openSignIn = () => {
    setModalMode('signin');
    setShowModal(true);
  };

  const openSignUp = () => {
    setModalMode('signup');
    setShowModal(true);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  if (loading) {
    return (
      <div className="h-8 w-20 rounded-lg bg-slate-800 animate-pulse" />
    );
  }

  // Not signed in state
  if (!user) {
    return (
      <>
        <div className="flex items-center gap-2">
          <button
            onClick={openSignIn}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={openSignUp}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        <AuthModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          initialMode={modalMode}
        />
      </>
    );
  }

  // Signed in state
  const displayName = userProfile?.displayName || user.displayName || (user.isAnonymous ? 'Guest User' : 'ATS Professional');
  const email = userProfile?.email || user.email || (user.isAnonymous ? 'Guest Access' : '');
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 p-1.5 pl-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all"
        >
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={displayName} 
              className="w-7 h-7 rounded-lg object-cover border border-slate-600"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          )}

          <div className="hidden sm:block text-left pr-1 max-w-[120px]">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-400 truncate leading-tight">
              {user.isAnonymous ? 'Guest Account' : email}
            </p>
          </div>

          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white text-slate-800 shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* User Header in Dropdown */}
            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={displayName} 
                    className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {displayName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {user.isAnonymous ? 'Temporary Guest Session' : email}
                  </p>
                </div>
              </div>

              {/* Status Pill */}
              <div className="mt-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Cloud Sync Enabled</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="py-1">
              {onNavigateToDashboard && (
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onNavigateToDashboard();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                >
                  <FolderKanban className="w-4 h-4 text-slate-500" />
                  <span>My Saved Resumes</span>
                </button>
              )}

              {user.isAnonymous && (
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    openSignUp();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2.5 font-semibold transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span>Upgrade to Permanent Account</span>
                </button>
              )}
            </div>

            {/* Logout Action */}
            <div className="border-t border-slate-100 pt-1 mt-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialMode={modalMode}
      />
    </>
  );
};
