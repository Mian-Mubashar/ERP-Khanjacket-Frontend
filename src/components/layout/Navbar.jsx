import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import logoImg from '../../images/khan jacket logo.png';
import { 
  Menu,
  Search, 
  Sun,
  Moon,
  ChevronDown,
  User,
  ShieldCheck,
  History,
  LogOut
} from 'lucide-react';

export const Navbar = () => {
  const { 
    currentUser, 
    switchRole, 
    logout,
    theme,
    toggleTheme,
    toggleSidebar,
    articles,
    setSelectedArticleDetail,
    setIsQuickSearchOpen,
    setActiveTab,
    setSecuritySubTab
  } = useApp();

  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (!val.trim()) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const q = val.toLowerCase().trim();
    const matched = articles.filter(art => 
      art.articleNo.toLowerCase().includes(q) ||
      art.name.toLowerCase().includes(q) ||
      art.category.toLowerCase().includes(q)
    );
    setSearchResults(matched);
    setIsDropdownOpen(true);
  };

  const handleSelectArticle = (art) => {
    setSelectedArticleDetail(art);
    setIsDropdownOpen(false);
    setSearchInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchResults.length > 0) {
        handleSelectArticle(searchResults[0]);
      } else {
        setIsQuickSearchOpen(true);
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-2xs">
      <div className="flex items-center justify-between px-4 lg:px-7 h-16">
        
        {/* Left: Hamburger & Brand Name */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={toggleSidebar}
            className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all"
            title="Toggle Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center cursor-pointer hover:opacity-90 transition-opacity py-0.5"
            title="Khan Jacket House - Dashboard"
          >
            <img
              src={logoImg}
              alt="Khan Jacket House"
              className="h-12 sm:h-14 w-auto object-contain drop-shadow-xs"
            />
          </button>
        </div>

        {/* Center: Live Fast Article Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>
            <input
              type="text"
              placeholder="Search Article Code (e.g. BF411, A012, JK205)..."
              value={searchInput}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (searchResults.length > 0) setIsDropdownOpen(true); }}
              className="w-full pl-11 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-hidden shadow-2xs"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5 pointer-events-none">
              <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Instant Search Results Dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-50">
              <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Matching Articles ({searchResults.length})</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Click to open full record</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 mt-1">
                {searchResults.map(art => (
                  <button
                    key={art.articleNo}
                    onClick={() => handleSelectArticle(art)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-bold text-xs border border-blue-200 dark:border-blue-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {art.articleNo}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {art.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {art.category} • Cost: Rs. {art.unitCost?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {art.currentStock.toLocaleString()} pcs
                      </div>
                      <div className="text-xs text-slate-400">In Stock</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Theme Toggle & Profile Avatar */}
        <div className="flex items-center gap-2.5">
          
          {/* Theme Toggle Button with clean subtle icon */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center gap-2 shadow-2xs"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-medium hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span className="text-xs font-medium hidden sm:inline">Dark</span>
              </>
            )}
          </button>


          {/* Audit History Shortcut */}
          <button
            onClick={() => {
              setSecuritySubTab('audit');
              setActiveTab('security');
            }}
            className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-2xs group cursor-pointer"
            title="System Audit Trail & Log"
          >
            <History className="w-4 h-4 text-slate-500 group-hover:rotate-[-20deg] transition-transform" />
          </button>

          {/* User Profile Avatar with Name & Online Indicator */}
          <div className="relative">
            <button
              onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
              className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
            >
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {currentUser?.role || 'User'}
              </span>
              
              <div className="relative">
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  <User className="w-4 h-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2.5 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{currentUser?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Role: <span className="font-bold text-blue-600 dark:text-blue-400">{currentUser?.role}</span></p>
                </div>
                <div className="py-1.5">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Role
                  </div>
                  {['Admin', 'Staff', 'Viewer'].map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        switchRole(role);
                        setIsRoleMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors ${
                        currentUser?.role === role 
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold' 
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{role} ({role === 'Admin' ? 'Full Access' : role === 'Staff' ? 'Stock Entries' : 'Read Only'})</span>
                      {currentUser?.role === role && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                    </button>
                  ))}
                </div>
                <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 mt-1 space-y-1">
                  <button
                    onClick={() => {
                      setSecuritySubTab('devices');
                      setActiveTab('security');
                      setIsRoleMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Authorized Mobiles & Access</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsRoleMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span>Sign Out of Portal</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
