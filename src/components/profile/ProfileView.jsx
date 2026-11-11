import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Mail, 
  Shield, 
  Camera, 
  Save, 
  Check, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { showToast } from '../../utils/sweetalert';

export const ProfileView = () => {
  const { currentUser, updateProfile } = useApp();

  // Parse existing first and last name from currentUser.name
  const parseNames = (fullName = '') => {
    const parts = fullName.trim().split(' ');
    if (parts.length <= 1) {
      return { firstName: parts[0] || '', lastName: '' };
    }
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    return { firstName, lastName };
  };

  const initialNames = parseNames(currentUser?.name);
  const [firstName, setFirstName] = useState(initialNames.firstName);
  const [lastName, setLastName] = useState(initialNames.lastName);
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state if currentUser changes externally
  useEffect(() => {
    const { firstName: f, lastName: l } = parseNames(currentUser?.name);
    setFirstName(f);
    setLastName(l);
    setAvatar(currentUser?.avatar || '');
  }, [currentUser]);

  // Handle client-side image compression to lightweight DataURL
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP)', 'error');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size exceeds 8MB limit. Please choose a smaller photo.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // High quality scale down to max 400x400
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
        setAvatar(compressedBase64);
        showToast('Photo selected! Click "Save Changes" to apply.', 'info');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatar('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    showToast('Photo removed. Click "Save Changes" to apply.', 'info');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    if (!fullName) {
      showToast('Please enter at least a first name', 'warning');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        name: fullName,
        avatar: avatar || null
      });
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim() || currentUser?.name || 'User Profile';

  return (
    <div className="space-y-4 w-full">
      
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                User Profile
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
                {currentUser?.role || 'Staff'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your personal account details, avatar photo, and name
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Account Active
          </span>
        </div>
      </div>

      {/* 2. Main Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar & Identity Info Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
            {/* Avatar with Camera Overlay */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-slate-800 border-2 border-blue-200 dark:border-blue-900/60 flex items-center justify-center overflow-hidden shadow-2xs">
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt={displayName} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                ) : (
                  <User className="w-10 h-10 text-blue-500 dark:text-blue-400 stroke-[1.75]" />
                )}
              </div>

              {/* Floating Camera Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900 transition-all cursor-pointer hover:scale-105"
                title="Change profile photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/png,image/jpeg,image/webp" 
                className="hidden" 
              />
            </div>

            {/* User Meta & Photo Action */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                {displayName}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize mt-0.5">
                {currentUser?.role || 'Staff'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="text-[11px] text-slate-400">
                  Choose a photo, then crop before saving
                </span>
                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="space-y-5">
            {/* Row 1: First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>First Name</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Mubashar"
                  required
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Last Name</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Hanif"
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                />
              </div>
            </div>

            {/* Row 2: Email (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email</span>
              </label>
              <input
                type="email"
                value={currentUser?.email || 'admin@khanclothes.com'}
                disabled
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium outline-hidden cursor-not-allowed select-none"
              />
              <p className="text-[11px] text-slate-400 pl-1">
                Email cannot be changed
              </p>
            </div>

            {/* Row 3: Role (Readonly) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>Role</span>
              </label>
              <input
                type="text"
                value={currentUser?.role ? currentUser.role.toLowerCase() : 'admin'}
                disabled
                readOnly
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-medium outline-hidden cursor-not-allowed select-none capitalize"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

