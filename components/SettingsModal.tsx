import React, { useState, useEffect, useRef } from 'react';
import { X, User, Mail, CreditCard, Clock, LogOut, Check, Bell, Settings, Camera, Calendar, Zap, Download, FileText, Trash2, ArrowRight, Shield, Key, Smartphone, Users, Code, Activity, Globe, Lock, Crown, Link, HardDrive, FileJson, Database } from 'lucide-react';
import { UserProfile, SavedAnalysis } from '../types';
import { logger } from '../services/loggerService';
import { StorageService } from '../services/storageService';
import { AuthService } from '../services/authService';

import api from '../services/api';

const TwoFactorSetup = ({ user, onUpdateUser }: { user: UserProfile, onUpdateUser: any }) => {
  const [step, setStep] = useState<'initial' | 'qr' | 'verify' | 'enabled'>('initial');
  const [secret, setSecret] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user.isTwoFactorEnabled) {
      setStep('enabled');
    }
  }, [user.isTwoFactorEnabled]);

  const startSetup = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/2fa/generate');
      setSecret(res.data.secret);
      setQrCode(res.data.qrCode);
      setStep('qr');
    } catch (err: any) {
      setError('Failed to generate 2FA secret');
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/2fa/verify', { token: verifyCode });
      setStep('enabled');
      onUpdateUser({ isTwoFactorEnabled: true });
    } catch (err: any) {
      setError('Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    if (!window.confirm("Are you sure you want to disable 2FA? This will reduce your account security.")) return;

    // Simple prompt for password since we don't have a sophisticated modal flow here for password input
    // Only if it's password user. If google user, backend handles it without password check for now or we skip.
    // For MVP, lets assume we can call disable. Backend requires password though.
    // Let's ask user for password via prompt (ugly but works for quick implementation)
    const password = prompt("Please confirm your password to disable 2FA:");
    if (!password) return;

    setLoading(true);
    try {
      await api.post('/auth/2fa/disable', { password });
      setStep('initial');
      onUpdateUser({ isTwoFactorEnabled: false });
    } catch (err: any) {
      alert("Failed to disable 2FA. " + (err.response?.data?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'enabled') {
    return (
      <div className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Two-Factor Authentication is ON</h4>
              <p className="text-sm text-slate-500 mt-1">Your account is secured with 2FA.</p>
            </div>
          </div>
          <button onClick={disable2FA} disabled={loading} className="text-sm text-red-600 hover:text-red-700 font-semibold hover:underline">
            Disable
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <div className="flex gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 h-fit">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-slate-500 mt-1">Secure your account with TOTP (Google Authenticator, Authy).</p>
            </div>
          </div>

          {step === 'initial' && (
            <button onClick={startSetup} disabled={loading} className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg text-sm">
              {loading ? 'Generating...' : 'Setup 2FA'}
            </button>
          )}

          {step === 'qr' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <p className="text-sm text-slate-600 dark:text-slate-300">1. Scan this QR code with your authenticator app.</p>
              <div className="p-4 bg-white rounded-lg inline-block border border-slate-200">
                <img src={qrCode} alt="2FA QR Code" className="w-40 h-40" />
              </div>
              <p className="text-xs text-slate-400 font-mono select-all">Secret: {secret}</p>

              <p className="text-sm text-slate-600 dark:text-slate-300 mt-4">2. Enter the 6-digit code.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="000 000"
                  className="w-32 px-3 py-2 border border-slate-300 rounded-md text-center tracking-widest font-mono"
                  maxLength={6}
                />
                <button onClick={verifySetup} disabled={loading || verifyCode.length < 6} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-md text-sm">
                  {loading ? 'Verifying...' : 'Verify & Enable'}
                </button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
};

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await AuthService.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all"
            required
          />
        </div>
      </div>

      {message && (
        <p className={`text-xs ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-medium rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </form>
  );
};

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
  onLoadAnalysis: (analysis: SavedAnalysis) => void;
  onNavigateToPricing: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, user, onUpdateUser, onLogout, onLoadAnalysis, onNavigateToPricing }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'team' | 'integrations' | 'billing' | 'compliance' | 'developer' | 'history'>('profile');
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<SavedAnalysis[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to check tier levels
  const getTierLevel = (plan: string) => {
    switch (plan) {
      case 'Team': return 3;
      case 'Enterprise': return 3;
      case 'Professional': return 2;
      case 'Starter': return 1;
      default: return 0; // Free
    }
  };

  const currentLevel = getTierLevel(user.plan);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setEmail(user.email);
      setAvatarUrl(user.avatarUrl);
      loadHistory();
    }
  }, [isOpen, user]);

  const loadHistory = () => {
    const data = StorageService.getHistory(user.id);
    setHistory(data);
  };

  if (!isOpen) return null;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateUser({ name, avatarUrl });
      setIsSaving(false);
    } catch (e) {
      setIsSaving(false);
    }
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Delete this analysis?")) {
      StorageService.deleteAnalysis(id);
      loadHistory();
    }
  };

  // Expanded Tabs List
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'team', label: 'Team', icon: Users, locked: currentLevel < 3 },
    { id: 'integrations', label: 'Integrations', icon: Link, locked: currentLevel < 2 },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
    { id: 'compliance', label: 'Compliance', icon: Database, locked: currentLevel < 3 },
    { id: 'developer', label: 'Developer', icon: Code, locked: currentLevel < 2 },
    { id: 'history', label: 'History', icon: Clock },
  ];

  const maxDocs = user.plan === 'Free' ? 1 : user.plan === 'Starter' ? 10 : 9999;
  const usagePercent = Math.min(100, Math.round((user.documentsAnalyzed / maxDocs) * 100));

  // Access Gate Component
  const PremiumGate = ({ title, description, minTier, action }: { title: string, description: string, minTier: string, action: () => void }) => (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center mb-6">
        <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">{description}</p>
      <button
        onClick={action}
        className="px-8 py-3 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
      >
        Upgrade to {minTier}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[800px] border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">

        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col pt-6 flex-shrink-0">
          <div className="px-6 mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Settings</h2>
          </div>

          <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`} />
                  {tab.label}
                </div>
                {tab.locked && <Lock className="w-3 h-3 text-slate-400" />}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
            <div className="flex items-center gap-3 px-3 py-3 rounded-lg bg-slate-100 dark:bg-slate-900 mb-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={() => { onClose(); onLogout(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-slate-500 hover:text-red-600 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-white dark:bg-slate-900 min-w-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar flex flex-col">

            {/* --- PROFILE TAB --- */}
            {activeTab === 'profile' && (
              <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                <HeaderSection title="Profile Overview" sub="Manage your public profile and preferences." />

                {/* ... (Avatar & Form Code - same as previous step, omitted for brevity but logic is preserved) ... */}
                <div className="flex items-center gap-6 p-6 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-sm" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-2xl font-bold text-slate-500 dark:text-slate-300 ring-4 ring-white dark:ring-slate-800">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">Your Avatar</h4>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Upload New</button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Preferences</h4>
                    <PreferenceToggle icon={Bell} title="Marketing Emails" desc="Receive product updates." />
                    <PreferenceToggle icon={Globe} title="Timezone" desc="Automatically set (GMT+5:30)" defaultChecked />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-slate-900/10"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* --- SECURITY TAB --- */}
            {activeTab === 'security' && (
              <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                <HeaderSection title="Security & Authentication" sub="Keep your account safe with robust security features." />



                <TwoFactorSetup user={user} onUpdateUser={onUpdateUser} />

                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Change Password</h4>
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="p-6">
                    <ChangePasswordForm />
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Active Sessions</h4>
                  {/* Session list logic same as before */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <SessionRow device="Chrome on Windows" location="Mumbai, India" ip="103.21.xx.xx" active />
                    <SessionRow device="Safari on iPhone" location="Delhi, India" ip="45.12.xx.xx" time="2 days ago" />
                  </div>
                </div>
              </div>
            )}

            {/* --- TEAM TAB --- */}
            {activeTab === 'team' && (
              currentLevel < 3 ? (
                <PremiumGate
                  title="Team Management"
                  description="Collaborate with your organization, manage seats, and assign roles. Available on Team Plan."
                  minTier="Team Plan"
                  action={() => { onClose(); onNavigateToPricing(); }}
                />
              ) : (
                // Team content same as before
                <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="flex justify-between items-end">
                    <HeaderSection title="Team Management" sub="Invite colleagues to collaborate on contracts." />
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4" /> Invite Member
                    </button>
                  </div>
                  {/* ... Team Stats ... */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">5</h4>
                      <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Seats</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <h4 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">2</h4>
                      <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Active Users</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <h4 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">3</h4>
                      <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Pending Invites</p>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                    <table className="w-full text-sm text-left">
                      {/* ... Table Head ... */}
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 font-semibold">
                        <tr>
                          <th className="px-6 py-4">User</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        <TeamRow name={user.name} email={user.email} role="Owner" status="Active" isYou />
                        <TeamRow name="Sarah Legal" email="sarah@legallens.ai" role="Admin" status="Active" />
                        <TeamRow name="" email="finance@legallens.ai" role="Viewer" status="Invited" />
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}

            {/* --- INTEGRATIONS TAB (NEW) --- */}
            {activeTab === 'integrations' && (
              currentLevel < 2 ? (
                <PremiumGate
                  title="Integrations"
                  description="Connect LegalLens with your favorite tools like Google Drive, Dropbox, and Clio."
                  minTier="Professional Plan"
                  action={() => { onClose(); onNavigateToPricing(); }}
                />
              ) : (
                <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                  <HeaderSection title="Connected Apps" sub="Sync your contracts and documents with external services." />

                  <div className="space-y-4">
                    <IntegrationRow icon={HardDrive} name="Google Drive" desc="Auto-sync contracts from a specific folder." status="Connected" />
                    <IntegrationRow icon={Database} name="Dropbox" desc="Backup analysis reports to Dropbox." status="Connect" />
                    <IntegrationRow icon={Activity} name="Slack" desc="Get notifications in a specific channel." status="Connect" />
                    <IntegrationRow icon={BriefcaseIcon} name="Clio" desc="Legal Practice Management sync." status="Premium" />
                  </div>
                </div>
              )
            )}

            {/* --- BILLING TAB --- */}
            {activeTab === 'billing' && (
              <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                <HeaderSection title="Subscription & Billing" sub="Manage your plan, payment methods, and invoices." />

                {/* Plan Card (Same as before) */}
                <div className="bg-slate-900 text-white rounded-xl p-8 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 p-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Current Plan</span>
                      <h3 className="text-3xl font-bold text-white">{user.plan}</h3>
                      <p className="text-slate-400 text-sm mt-1">Renews on Nov 1, 2026</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase rounded-full border border-emerald-500/30">Active</span>
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 font-medium">Usage</span>
                      <span className="text-white font-bold">{user.documentsAnalyzed} / {maxDocs} Contracts</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${usagePercent}%` }}></div>
                    </div>
                  </div>

                  <div className="mt-8 relative z-10 flex gap-4">
                    <button onClick={() => { onClose(); onNavigateToPricing(); }} className="px-5 py-2.5 bg-white text-slate-900 text-sm font-bold rounded-lg hover:bg-slate-100 transition-colors">
                      Change Plan
                    </button>
                  </div>
                </div>
                {/* ... Payment details ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Payment Methods</h4>
                    <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="w-10 h-6 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">VISA</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">•••• 4242</p>
                        <p className="text-xs text-slate-500">Expires 09/28</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Invoices</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Oct 1, 2023</span>
                        <span className="font-medium text-slate-900 dark:text-white">₹1,499.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- COMPLIANCE TAB (NEW) --- */}
            {activeTab === 'compliance' && (
              currentLevel < 3 ? (
                <PremiumGate
                  title="Compliance Center"
                  description="Audit logs, data retention policies, and GDPR controls."
                  minTier="Team Plan"
                  action={() => { onClose(); onNavigateToPricing(); }}
                />
              ) : (
                <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                  <HeaderSection title="Governance & Compliance" sub="Manage data retention and audit logs." />

                  <div className="p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800">
                    <h4 className="font-bold text-slate-900 dark:text-white mb-4">Data Retention</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Analysis Data</p>
                        <p className="text-xs text-slate-500">How long we store your contract analysis.</p>
                      </div>
                      <select className="px-3 py-2 bg-slate-100 dark:bg-slate-900 rounded-md text-sm border-none outline-none">
                        <option>30 Days</option>
                        <option>1 Year</option>
                        <option selected>Indefinite</option>
                      </select>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Audit Log</h4>
                    </div>
                    <table className="w-full text-sm text-left">
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                        <AuditRow action="User Login" user="yash@legallens.ai" time="2 mins ago" ip="10.0.0.1" />
                        <AuditRow action="Settings Changed" user="sarah@legallens.ai" time="1 hour ago" ip="10.0.0.2" />
                        <AuditRow action="Export Data" user="admin@legallens.ai" time="1 day ago" ip="192.168.1.1" />
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end">
                    <button className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-lg">
                      <FileJson className="w-4 h-4" /> Export All Data (JSON)
                    </button>
                  </div>
                </div>
              )
            )}

            {/* --- DEVELOPER TAB --- */}
            {activeTab === 'developer' && (
              currentLevel < 2 ? (
                <PremiumGate
                  title="Developer API & Webhooks"
                  description="Integrate LegalLens into your own applications with our powerful API."
                  minTier="Professional Plan"
                  action={() => { onClose(); onNavigateToPricing(); }}
                />
              ) : (
                // Developer content same as before ...
                <div className="max-w-2xl space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
                  <HeaderSection title="Developer Settings" sub="Manage API keys and webhooks." />

                  <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 text-white">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-white flex items-center gap-2">
                          <Key className="w-4 h-4 text-emerald-400" /> API Keys
                        </h4>
                        <p className="text-slate-400 text-xs mt-1">Use these keys to access LegalLens programmatically.</p>
                      </div>
                      <button className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors">Generate New</button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs">
                        <span className="flex-1 text-slate-300 truncate">ll_live_xk9...8j2m</span>
                        <button className="text-slate-500 hover:text-white">Copy</button>
                      </div>
                      <p className="text-[10px] text-slate-500">Created: 2 days ago • Scope: Read/Write</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Webhooks</h4>
                    <div className="p-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-center">
                      <Activity className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                      <p className="text-sm font-medium text-slate-900 dark:text-white">No webhooks configured</p>
                      <p className="text-xs text-slate-500 mb-4 max-w-xs">Receive real-time updates when an analysis is completed.</p>
                      <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">Add Endpoint</button>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* --- HISTORY TAB --- */}
            {activeTab === 'history' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="flex justify-between items-center">
                  <div>
                    <HeaderSection title="Analysis Activity" sub="Your recent document scans." />
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm("Clear all history?")) {
                        StorageService.clearHistory();
                        loadHistory();
                      }
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1.5 bg-red-50 dark:bg-red-900/10 rounded-md"
                  >
                    Clear History
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm text-left">
                    {/* ... History Table ... */}
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-500 font-semibold mobile-hidden">
                      <tr>
                        <th className="px-6 py-3">Document</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {history.length === 0 ? (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No history yet. Start analyzing!</td></tr>
                      ) : (
                        history.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => onLoadAnalysis(item)}>
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                                <FileText className="w-4 h-4" />
                              </div>
                              {item.fileName}
                            </td>
                            <td className="px-6 py-4 text-slate-500">{item.date}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${item.result.verdict.status === 'High Risk' ? 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30' :
                                item.result.verdict.status === 'Negotiate' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/30' :
                                  'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/30'
                                }`}>
                                {item.result.verdict.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={(e) => handleDeleteHistoryItem(item.id, e)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-red-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Components ---

// ... (HeaderSection, PreferenceToggle, SessionRow, TeamRow - same as before)
const HeaderSection = ({ title, sub }: { title: string, sub: string }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
  </div>
);

const PreferenceToggle = ({ icon: Icon, title, desc, defaultChecked }: { icon: any, title: string, desc: string, defaultChecked?: boolean }) => (
  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800/50">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-400">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-white text-sm">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
    <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out">
      <input type="checkbox" defaultChecked={defaultChecked} className="peer absolute opacity-0 w-0 h-0" id={`toggle-${title}`} />
      <label htmlFor={`toggle-${title}`} className="block w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer peer-checked:bg-slate-900 dark:peer-checked:bg-white transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white dark:after:bg-slate-900 after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:after:translate-x-5"></label>
    </div>
  </div>
);

const SessionRow = ({ device, location, ip, time, active }: any) => (
  <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 last:border-0 bg-white dark:bg-slate-800">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded text-slate-500">
        {device.includes("Phone") ? <Smartphone className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{device}</p>
        <p className="text-xs text-slate-500">{location} • {ip}</p>
      </div>
    </div>
    {active ? (
      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">Current</span>
    ) : (
      <span className="text-xs text-slate-400">{time}</span>
    )}
  </div>
);

const TeamRow = ({ name, email, role, status, isYou }: any) => (
  <tr className="bg-white dark:bg-slate-900">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400">
          {name ? name.charAt(0) : email.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">{name || email} {isYou && <span className="text-xs text-slate-500">(You)</span>}</p>
          <p className="text-xs text-slate-500">{email}</p>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm">{role}</td>
    <td className="px-6 py-4">
      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
        {status}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <button className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
        <Settings className="w-4 h-4" />
      </button>
    </td>
  </tr>
)

const IntegrationRow = ({ icon: Icon, name, desc, status }: any) => (
  <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h4 className="font-bold text-slate-900 dark:text-white">{name}</h4>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
    <button className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${status === 'Connected'
      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
      : status === 'Premium'
        ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
        : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
      }`}>
      {status}
    </button>
  </div>
)

const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
)

const AuditRow = ({ action, user, time, ip }: any) => (
  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
    <td className="px-6 py-3 font-medium text-slate-900 dark:text-white">{action}</td>
    <td className="px-6 py-3 text-slate-500">{user}</td>
    <td className="px-6 py-3 text-slate-500">{time}</td>
    <td className="px-6 py-3 text-right font-mono text-xs text-slate-400">{ip}</td>
  </tr>
)

export default SettingsModal;
