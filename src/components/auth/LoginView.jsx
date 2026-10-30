import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Building2,
  Package,
  Layers,
  ArrowRight,
  Smartphone,
  CheckCircle2,
  Sparkles,
  KeyRound,
  AlertCircle
} from 'lucide-react';
import { showError, showToast } from '../../utils/sweetalert';
import logoImg from '../../images/khan jacket logo.png';

export const LoginView = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Login Submit
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email address and password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setErrorMessage(result.message || 'Login failed. Please verify your credentials.');
        showError('Access Denied', result.message || 'Invalid email or password.');
      } else {
        showToast(`Welcome back, ${result.user.name}!`, 'success');
        const targetPath = location.state?.from?.pathname || '/dashboard';
        navigate(targetPath, { replace: true });
      }
    } catch (err) {
      const msg = err.message || 'Unable to connect to warehouse backend server.';
      setErrorMessage(msg);
      showError('Connection Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Quick select demo account credentials
  const selectDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-950 font-sans text-slate-100 selection:bg-blue-600 selection:text-white">
      
      {/* LEFT COLUMN: HERO SHOWCASE (Textile & ERP Aesthetic) */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border-r border-slate-800/80">
        
        {/* Ambient Glows */}
        <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center">
          <img
            src={logoImg}
            alt="Khan Jacket House Logo"
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Center Pitch & Highlight Cards */}
        <div className="relative z-10 my-auto py-8 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Inventory & China Clearing Management</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              Real-time Stock, <br />
              China Shipments & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                Wholesale Khatas.
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-4 max-w-md leading-relaxed">
              Centralized warehouse command center for China import containers, 
              goods outward gate passes, fabric types, and city branch distribution ledgers.
            </p>
          </div>

          {/* 3 Live Mini Stats Showcase */}
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                <Package className="w-3.5 h-3.5 text-blue-400" />
                <span>Inventory</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">6,600+</div>
              <div className="text-[10px] text-slate-500">Live warehouse pcs</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Valuation</span>
              </div>
              <div className="text-lg font-bold text-emerald-400 font-mono">PKR 95.2M</div>
              <div className="text-[10px] text-slate-500">Stock market value</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
                <Smartphone className="w-3.5 h-3.5 text-purple-400" />
                <span>Security</span>
              </div>
              <div className="text-lg font-bold text-white font-mono">4-5 Units</div>
              <div className="text-[10px] text-slate-500">Hardware auth limit</div>
            </div>
          </div>

          {/* Core Highlights */}
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Strictly Size-free & Color-free China Garment Cataloging</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Granular Role-Based Access Control (Admin, Staff, Auditor)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Atomic Ledger Transactions with Node.js & MySQL Engine</span>
            </div>
          </div>
        </div>

        {/* Bottom Security Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>256-Bit TLS Encryption</span>
          </div>
          <span>v2.4.0 • Enterprise Edition</span>
        </div>

      </div>

      {/* RIGHT COLUMN: LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 bg-slate-900/90 lg:bg-slate-950">
        
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center mb-6">
          <img
            src={logoImg}
            alt="Khan Jacket House Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* Main Card */}
        <div className="w-full max-w-md mx-auto my-auto space-y-7">
          
          {/* Card Title */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Warehouse Sign In
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
              Enter your authorized credentials to access inventory rates, China shipments, and wholesale khatas.
            </p>
          </div>

          {/* Error Alert if any */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  required
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">
                  Bcrypt Hashed
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-sm font-semibold text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-sm border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/30"
                />
                <span>Remember authorized device</span>
              </label>

              <span className="text-[11px] text-emerald-400 font-medium">
                Hardware policy: 4-5 limit
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating with MySQL...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Warehouse Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Profiles (Senior Experience) */}
          <div className="pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2.5">
              <span>Quick 1-Click Demo Credentials:</span>
              <span className="text-[10px] text-blue-400">Click to Auto-Fill</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              
              {/* Profile 1: Admin */}
              <button
                type="button"
                onClick={() => selectDemoAccount('admin@khanclothes.com', 'admin123')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  email === 'admin@khanclothes.com'
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-blue-400">Owner</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white truncate">Admin Khan</div>
                <div className="text-[10px] text-slate-400">Full Master</div>
              </button>

              {/* Profile 2: Staff */}
              <button
                type="button"
                onClick={() => selectDemoAccount('staff@khanclothes.com', 'staff123')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  email === 'staff@khanclothes.com'
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-indigo-400">Staff</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                </div>
                <div className="text-xs font-bold text-white truncate">Tariq Mehmood</div>
                <div className="text-[10px] text-slate-400">Warehouse Mal</div>
              </button>

              {/* Profile 3: Viewer */}
              <button
                type="button"
                onClick={() => selectDemoAccount('viewer@khanclothes.com', 'viewer123')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  email === 'viewer@khanclothes.com'
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-purple-400">Auditor</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                </div>
                <div className="text-xs font-bold text-white truncate">Asim Bilal</div>
                <div className="text-[10px] text-slate-400">Read-Only</div>
              </button>

            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 pt-6">
          <p>© 2026 Khan Clothes Pakistan • Central Warehouse ERP & Inventory System</p>
        </div>

      </div>

    </div>
  );
};
