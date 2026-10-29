import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShieldCheck,
  Smartphone,
  Plus,
  CloudCheck,
  Fingerprint
} from 'lucide-react';
import { confirmAction, showSuccess, showToast } from '../../utils/sweetalert';

export const SecurityModal = () => {
  const { 
    isSecurityModalOpen, 
    setIsSecurityModalOpen, 
    devices, 
    toggleDeviceStatus, 
    addDevice,
    currentUser,
    switchRole
  } = useApp();

  const [activeTab, setActiveTab] = useState('devices');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceModel, setNewDeviceModel] = useState('');
  const [newDeviceOwner, setNewDeviceOwner] = useState('');

  if (!isSecurityModalOpen) return null;

  const handleAddDevice = (e) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;
    const devName = newDeviceName.trim();
    addDevice({
      deviceName: devName,
      model: newDeviceModel || 'Smart Mobile Device',
      owner: newDeviceOwner || 'Staff Member',
      location: 'Warehouse Floor'
    });
    showSuccess('Device Authorized!', `"${devName}" has been added to authorized devices.`);
    setNewDeviceName('');
    setNewDeviceModel('');
    setNewDeviceOwner('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Authorized Mobiles & Access Control
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                4-5 Mobile phone authorization, access revocation, user roles & cloud security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSecurityModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-slate-200 dark:border-slate-800 flex space-x-2">
          {[
            { id: 'devices', label: 'Authorized Mobiles (4-5 Devices)', count: devices.length },
            { id: 'roles', label: 'User Roles & Permissions', count: 3 },
            { id: 'backup', label: 'Cloud Backup & 2FA', count: null }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          
          {/* 1. Devices Tab */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Device Access Control:</strong> Only 4-5 authorized devices can access your warehouse database. If any mobile phone is lost or misplaced, revoke access immediately below to protect your financial and stock data.
                </div>
              </div>

              {/* List of Devices */}
              <div className="space-y-2.5">
                {devices.map((dev) => {
                  const isAuth = dev.status === 'Authorized';
                  return (
                    <div
                      key={dev.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isAuth 
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs' 
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          isAuth 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{dev.deviceName}</span>
                            {dev.isCurrent && (
                              <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.2 rounded-full">
                                Active Device
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              isAuth ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {dev.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {dev.model} • User: {dev.owner} • {dev.location}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            IP: {dev.ipAddress} • {dev.lastActive}
                          </div>
                        </div>
                      </div>

                      <div>
                        <button
                          onClick={async () => {
                            if (isAuth) {
                              const isConfirmed = await confirmAction({
                                title: `Revoke Device Access?`,
                                text: `Are you sure you want to revoke warehouse access for "${dev.deviceName}" (${dev.model})?`,
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
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            isAuth
                              ? 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {isAuth ? 'Revoke Access' : 'Re-Authorize'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Authorized Device Form */}
              <form onSubmit={handleAddDevice} className="pt-2 space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Authorize New Mobile Device
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Device Label (e.g. Incharge Galaxy S24)"
                    value={newDeviceName}
                    onChange={e => setNewDeviceName(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Model (e.g. Samsung / iPhone)"
                    value={newDeviceModel}
                    onChange={e => setNewDeviceModel(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Assigned Staff Member"
                    value={newDeviceOwner}
                    onChange={e => setNewDeviceOwner(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50/70 hover:bg-slate-50 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-hidden transition-all"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Authorize Device</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Manage user access levels for warehouse staff and auditors:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    role: 'Admin',
                    title: 'Admin (Full Access)',
                    desc: 'Full control over articles, China purchases, payments, vendor ledgers, and device security.',
                  },
                  {
                    role: 'Staff',
                    title: 'Staff (Stock & Entries)',
                    desc: 'Record inward shipments and outward gate passes. Financial settings are view-only.',
                  },
                  {
                    role: 'Viewer',
                    title: 'Viewer (Reports Only)',
                    desc: 'Auditor access to view stock counts and reports. Cannot edit or delete records.',
                  }
                ].map((item) => (
                  <div
                    key={item.role}
                    className={`p-4 rounded-xl border transition-all ${
                      currentUser.role === item.role
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs ring-2 ring-blue-100 dark:ring-blue-900'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                      {currentUser.role === item.role && (
                        <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 px-2 py-0.2 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{item.desc}</p>
                    <button
                      onClick={() => switchRole(item.role)}
                      className={`w-full py-1.5 text-xs font-bold rounded-lg transition-colors ${
                        currentUser.role === item.role
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {currentUser.role === item.role ? 'Current Role' : `Switch to ${item.role}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Backup & 2FA Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3">
                <CloudCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                  <div className="font-bold text-sm">Automatic Cloud Backup: Active</div>
                  <p>
                    All articles, shipments, and vendor ledger balances are automatically backed up in real time. Logging into a newly authorized device restores full business history.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Fingerprint className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Biometric & 2FA Login</div>
                      <div className="text-[11px] text-slate-400">Fingerprint / FaceID security on authorized mobile phones</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setIsSecurityModalOpen(false)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};
