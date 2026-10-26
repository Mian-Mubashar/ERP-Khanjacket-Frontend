import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Smartphone,
  Plus,
  CloudCheck,
  Fingerprint,
  History,
  Search,
  Clock,
  UserCheck,
  AlertTriangle,
  Lock,
  Download,
  KeyRound,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { confirmAction, showSuccess, showToast } from '../../utils/sweetalert';

export const SecurityView = () => {
  const {
    devices,
    toggleDeviceStatus,
    addDevice,
    currentUser,
    switchRole,
    auditLogs,
    articles,
    purchases,
    outward,
    suppliers,
    customers,
    securitySubTab,
    setSecuritySubTab
  } = useApp();

  const activeTab = securitySubTab || 'devices';
  const setActiveTab = setSecuritySubTab;

  // New device form state
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('');
  const [newDeviceOwner, setNewDeviceOwner] = useState('');
  const [newDeviceLocation, setNewDeviceLocation] = useState('Karachi Central Warehouse');

  // Audit search & category filter
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState('ALL');

  // Handle device add
  const handleAddDevice = (e) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    const devName = newDeviceName.trim();
    addDevice({
      deviceName: devName,
      model: newDeviceModel.trim() || 'Smart Mobile Device',
      owner: newDeviceOwner.trim() || 'Staff Member',
      location: newDeviceLocation.trim() || 'Karachi Central Warehouse'
    });
    showSuccess('Device Authorized!', `"${devName}" has been successfully added to authorized devices list.`);
    setNewDeviceName('');
    setNewDeviceModel('');
    setNewDeviceOwner('');
  };

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.category.toLowerCase().includes(auditSearch.toLowerCase());

    const matchesCategory =
      auditCategory === 'ALL' ||
      log.category.toLowerCase().includes(auditCategory.toLowerCase()) ||
      log.action.toLowerCase().includes(auditCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  // Database Backup JSON Download
  const handleDownloadBackup = () => {
    const backupData = {
      app: 'Khan Clothes Warehouse & Inventory System',
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      user: currentUser.name,
      statistics: {
        articlesCount: articles.length,
        purchasesCount: purchases.length,
        outwardCount: outward.length,
        suppliersCount: suppliers.length,
        customersCount: customers.length,
        auditLogsCount: auditLogs.length
      },
      data: {
        articles,
        purchases,
        outward,
        suppliers,
        customers,
        devices,
        auditLogs
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KhanClothes_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const authorizedDevicesCount = devices.filter(d => d.status === 'Authorized').length;

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Authorized Mobiles & Access Control
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {authorizedDevicesCount} / {devices.length} Mobiles Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                4-5 Mobile phone authorization, access revocation, user roles, audit trail & cloud security
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Export Cloud Backup</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Authorized Devices */}
        <div 
          onClick={() => setActiveTab('devices')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'devices' 
              ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Authorized Mobiles</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-1 font-medium">4-5 Devices limit control</div>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {authorizedDevicesCount} Active
          </div>
        </div>

        {/* Card 2: Current User Role */}
        <div 
          onClick={() => setActiveTab('roles')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'roles' 
              ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">User Role</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-1 font-medium">{currentUser.name}</div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {currentUser.role}
          </div>
        </div>

        {/* Card 3: Cloud Database Security */}
        <div 
          onClick={() => setActiveTab('backup')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'backup' 
              ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Cloud Database</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <CloudCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-1 font-medium">Auto real-time sync</div>
          <div className="text-xl font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            <span>Encrypted Active</span>
          </div>
        </div>

        {/* Card 4: Audit Logs Count */}
        <div 
          onClick={() => setActiveTab('audit')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            activeTab === 'audit' 
              ? 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs' 
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider">Audit Trail</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs text-slate-400 mb-1 font-medium">Activity & edits tracker</div>
          <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {auditLogs.length} Events
          </div>
        </div>

      </div>

      {/* Main Tabbed Interface */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        
        {/* Navigation Tabs Bar */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
          {[
            { id: 'devices', label: 'Authorized Mobiles (4-5 Devices)', count: devices.length, icon: Smartphone },
            { id: 'audit', label: 'System Audit Trail & Log', count: auditLogs.length, icon: History },
            { id: 'roles', label: 'User Roles & Permissions', count: 3, icon: UserCheck },
            { id: 'backup', label: 'Cloud Backup & 2FA', count: null, icon: CloudCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-6">
          
          {/* TAB 1: AUTHORIZED MOBILES (4-5 DEVICES) */}
          {activeTab === 'devices' && (
            <div className="space-y-6">
              
              {/* Notice Banner */}
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm">Strict Device Access Control (Khan Clothes Warehouse Policy):</div>
                  <p className="leading-relaxed">
                    Only 4 to 5 authorized mobile phones or scanner tablets can access your central warehouse database. 
                    If any employee's mobile phone is lost, stolen, or staff is relieved, <strong>immediately click "Revoke Access" below</strong> to instantly block all purchase bills, customer ledgers, and stock data from that device.
                  </p>
                </div>
              </div>

              {/* Devices Grid / List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>Authorized Hardware Registry ({devices.length} Devices Registered)</span>
                  <span className="text-[11px]">Maximum Limit: 5 Hardware Units</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {devices.map((dev) => {
                    const isAuth = dev.status === 'Authorized';
                    return (
                      <div
                        key={dev.id}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isAuth 
                            ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700' 
                            : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className={`p-3 rounded-xl shrink-0 ${
                            isAuth 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            <Smartphone className="w-5 h-5" />
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {dev.deviceName}
                              </span>
                              {dev.isCurrent && (
                                <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                  Current Device (This Session)
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isAuth 
                                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}>
                                {dev.status}
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <strong>{dev.model}</strong> • Assigned To: <strong className="text-slate-700 dark:text-slate-300">{dev.owner}</strong> • Location: <span>{dev.location}</span>
                            </div>

                            <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-3">
                              <span>IP: {dev.ipAddress}</span>
                              <span>•</span>
                              <span>Last Active: {dev.lastActive}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={async () => {
                              if (isAuth) {
                                const isConfirmed = await confirmAction({
                                  title: `Revoke Device Access?`,
                                  text: `Are you sure you want to revoke warehouse access for "${dev.deviceName}" (${dev.model})? Staff member will be immediately locked out.`,
                                  confirmButtonText: 'Yes, Revoke Access',
                                  icon: 'warning'
                                });
                                if (isConfirmed) {
                                  await toggleDeviceStatus(dev.id);
                                  showToast(`Access revoked for "${dev.deviceName}"!`, 'warning');
                                }
                              } else {
                                await toggleDeviceStatus(dev.id);
                                showToast(`Device "${dev.deviceName}" re-authorized!`, 'success');
                              }
                            }}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ${
                              isAuth
                                ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold'
                            }`}
                          >
                            {isAuth ? (
                              <>
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Revoke Access</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Re-Authorize Device</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Authorize New Device Form Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Authorize New Mobile Device (Khan Staff Phone)
                  </h3>
                </div>

                <form onSubmit={handleAddDevice} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Device Name / Label *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tariq SB Galaxy S24"
                        value={newDeviceName}
                        onChange={e => setNewDeviceName(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Hardware Model
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. iPhone 15 Pro / Samsung"
                        value={newDeviceModel}
                        onChange={e => setNewDeviceModel(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Assigned Employee / Staff Member
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tariq Mehmood (Manager)"
                        value={newDeviceOwner}
                        onChange={e => setNewDeviceOwner(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-hidden font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Warehouse / City Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Karachi Warehouse / Lahore Shop"
                        value={newDeviceLocation}
                        onChange={e => setNewDeviceLocation(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 outline-hidden font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-slate-400">
                      Once added, the phone can scan QR/barcodes and access live stock balances.
                    </p>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Authorize Device Now</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* TAB 2: SYSTEM AUDIT TRAIL & LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md w-full">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search audit trail by user, action, article or invoice..."
                    value={auditSearch}
                    onChange={e => setAuditSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 rounded-xl border border-slate-200 dark:border-slate-700 focus:border-blue-600 outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  {['ALL', 'Outward', 'Stock', 'Purchase', 'Security'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setAuditCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        auditCategory === cat
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audit Logs List */}
              <div className="space-y-3 pt-2">
                {filteredAuditLogs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    No matching audit records found.
                  </div>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors space-y-2 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px] border border-blue-200 dark:border-blue-800">
                            {log.action}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {log.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{log.timestamp}</span>
                          <span>• Logged by: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{log.userName}</strong></span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                        {log.details}
                      </div>

                      {log.impact && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">Balance / Stock Impact:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{log.impact}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 3: USER ROLES & PERMISSIONS */}
          {activeTab === 'roles' && (
            <div className="space-y-6">
              
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Select and configure user permission levels for Khan Clothes warehouse operators and managers:
              </div>

              {/* 3 Role Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    role: 'Admin',
                    title: 'Admin / Owner (Full Control)',
                    desc: 'Complete control over article pricing, China shipments, vendor payments, customer khatas, and device authorizations.',
                    badge: 'Full Master Privileges'
                  },
                  {
                    role: 'Staff',
                    title: 'Warehouse Manager / Staff',
                    desc: 'Authorized to record container arrivals, issue outward dispatch challans, and count stock. Vendor payables are read-only.',
                    badge: 'Operational Entries'
                  },
                  {
                    role: 'Viewer',
                    title: 'Auditor / Accountant Viewer',
                    desc: 'Read-only access to verify stock valuations, closing balances, and download reports. Modification disabled.',
                    badge: 'Read-Only Audit'
                  }
                ].map((item) => {
                  const isCurrent = currentUser.role === item.role;
                  return (
                    <div
                      key={item.role}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-100 dark:ring-blue-900'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="inline-block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                          {item.badge}
                        </span>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>

                      <button
                        onClick={() => switchRole(item.role)}
                        className={`w-full py-2 text-xs font-semibold rounded-xl transition-all ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isCurrent ? 'Current Active Role' : `Switch Role to ${item.role}`}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Permissions Matrix Table */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  System Permissions Matrix (Khan Clothes)
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500">
                        <th className="py-2.5 px-4">Feature / Action</th>
                        <th className="py-2.5 px-4 text-center">Admin (Owner)</th>
                        <th className="py-2.5 px-4 text-center">Warehouse Staff</th>
                        <th className="py-2.5 px-4 text-center">Viewer (Auditor)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Record China Import Purchases</td>
                        <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">Yes</td>
                        <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">Yes</td>
                        <td className="py-2.5 px-4 text-center text-rose-500">View Only</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Create Goods Outward Challan</td>
                        <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">Yes</td>
                        <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">Yes</td>
                        <td className="py-2.5 px-4 text-center text-rose-500">View Only</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Add / Edit Vendor TT Payments</td>
                        <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">Yes</td>
                        <td className="py-2.5 px-4 text-center text-rose-500">Restricted</td>
                        <td className="py-2.5 px-4 text-center text-rose-500">Restricted</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Authorize / Revoke Mobile Phones</td>
                        <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">Yes</td>
                        <td className="py-2.5 px-4 text-center text-rose-500">Restricted</td>
                        <td className="py-2.5 px-4 text-center text-rose-500">Restricted</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">Download Executive PDF Statements</td>
                        <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">Yes</td>
                        <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">Yes</td>
                        <td className="py-2.5 px-4 text-center text-emerald-600 font-bold">Yes</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CLOUD BACKUP & 2FA */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                <CloudCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                  <div className="font-bold text-sm">Central Real-Time Cloud Backup: ACTIVE</div>
                  <p className="leading-relaxed">
                    All articles, China container imports, factory payments, and customer balances are saved securely. 
                    If you open this app on any authorized mobile, the entire state syncs automatically.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Fingerprint className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Biometric & 2FA Mobile Login</div>
                        <div className="text-[11px] text-slate-400">Fingerprint / FaceID security on authorized phones</div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Enabled
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Prevents unauthorized warehouse visitors from peeking at stock rates or factory cost sheets.
                  </p>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Manual Database Snapshot</div>
                        <div className="text-[11px] text-slate-400">Export complete offline JSON backup</div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Complete Backup File</span>
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
