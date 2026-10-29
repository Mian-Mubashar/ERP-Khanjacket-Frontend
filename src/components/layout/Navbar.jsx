import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  LogOut,
  X,
  Store,
  Truck,
  Globe,
  Tag,
  ArrowRight,
  Sparkles
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
    customers,
    suppliers,
    outward,
    setSelectedArticleDetail,
    setSelectedCustomerKhata,
    setSelectedSupplierDetail,
    setIsQuickSearchOpen,
    setActiveTab,
    setSecuritySubTab
  } = useApp();

  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | 'ARTICLES' | 'CUSTOMERS' | 'SUPPLIERS' | 'DISPATCHES'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsDropdownOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Universal multi-entity search results
  const searchResults = useMemo(() => {
    const q = searchInput.toLowerCase().trim();
    if (!q) return [];

    const results = [];

    // 1. Articles
    if (selectedCategory === 'ALL' || selectedCategory === 'ARTICLES') {
      articles.forEach(art => {
        if (
          art.articleNo?.toLowerCase().includes(q) ||
          art.name?.toLowerCase().includes(q) ||
          art.category?.toLowerCase().includes(q) ||
          art.stuff?.toLowerCase().includes(q)
        ) {
          results.push({
            type: 'ARTICLE',
            id: `art-${art.articleNo}`,
            title: art.articleNo,
            subtitle: art.name,
            extra: `${art.category || 'Garment'} • Stock: ${art.currentStock?.toLocaleString()} pcs`,
            badge: `${art.currentStock} pcs`,
            badgeColor: 'emerald',
            data: art
          });
        }
      });
    }

    // 2. Customers / Shopkeepers
    if (selectedCategory === 'ALL' || selectedCategory === 'CUSTOMERS') {
      customers.forEach(cust => {
        if (
          cust.shopName?.toLowerCase().includes(q) ||
          cust.shopkeeperName?.toLowerCase().includes(q) ||
          cust.city?.toLowerCase().includes(q) ||
          cust.phone?.includes(q) ||
          cust.id?.toLowerCase().includes(q)
        ) {
          const bal = Number(cust.remainingBalance) || 0;
          results.push({
            type: 'CUSTOMER',
            id: `cust-${cust.id}`,
            title: cust.shopName,
            subtitle: `Dukaandaar: ${cust.shopkeeperName || '—'} (${cust.city})`,
            extra: `Phone: ${cust.phone || '—'} • ${cust.id}`,
            badge: `Baqaya: Rs. ${Math.round(bal).toLocaleString()}`,
            badgeColor: bal > 0 ? 'rose' : 'emerald',
            data: cust
          });
        }
      });
    }

    // 3. Suppliers (China Vendors)
    if (selectedCategory === 'ALL' || selectedCategory === 'SUPPLIERS') {
      suppliers.forEach(supp => {
        if (
          supp.company?.toLowerCase().includes(q) ||
          supp.contactPerson?.toLowerCase().includes(q) ||
          supp.id?.toLowerCase().includes(q) ||
          supp.country?.toLowerCase().includes(q)
        ) {
          const bal = Number(supp.balance) || 0;
          results.push({
            type: 'SUPPLIER',
            id: `supp-${supp.id}`,
            title: supp.company,
            subtitle: `Contact: ${supp.contactPerson || 'Vendor'} • ${supp.country || 'China'}`,
            extra: `Payable Due: Rs. ${Math.round(bal).toLocaleString()}`,
            badge: `Vendor Due: Rs. ${Math.round(bal).toLocaleString()}`,
            badgeColor: 'amber',
            data: supp
          });
        }
      });
    }

    // 4. Outward Dispatches (Challans)
    if (selectedCategory === 'ALL' || selectedCategory === 'DISPATCHES') {
      outward.forEach(disp => {
        if (
          disp.challanNo?.toLowerCase().includes(q) ||
          disp.customerName?.toLowerCase().includes(q) ||
          disp.articleNo?.toLowerCase().includes(q) ||
          disp.destination?.toLowerCase().includes(q)
        ) {
          results.push({
            type: 'DISPATCH',
            id: `disp-${disp.id}`,
            title: `Challan #${disp.challanNo}`,
            subtitle: `To: ${disp.customerName} (${disp.city || 'Wholesale'})`,
            extra: `${disp.articleNo} • ${disp.quantity} pcs @ Rs. ${disp.unitSalePrice}`,
            badge: `Rs. ${(disp.totalSaleAmount || 0).toLocaleString()}`,
            badgeColor: 'blue',
            data: disp
          });
        }
      });
    }

    return results.slice(0, 20); // Cap at 20 quick matches
  }, [searchInput, selectedCategory, articles, customers, suppliers, outward]);

  const handleSelectResult = (item) => {
    if (!item) return;

    if (item.type === 'ARTICLE') {
      setSelectedArticleDetail(item.data);
    } else if (item.type === 'CUSTOMER') {
      setSelectedCustomerKhata(item.data);
    } else if (item.type === 'SUPPLIER') {
      setSelectedSupplierDetail(item.data);
    } else if (item.type === 'DISPATCH') {
      navigate('/outward');
    }

    setIsDropdownOpen(false);
    setSearchInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, searchResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + searchResults.length) % Math.max(1, searchResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        handleSelectResult(searchResults[selectedIndex] || searchResults[0]);
      } else {
        setIsQuickSearchOpen(true);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
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

        {/* Center: Universal Omnibox Search Across Everything */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-6 relative" ref={dropdownRef}>
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>

            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search Article, Shopkeeper / Khata, Vendor, Challan # (Ctrl+K)..."
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value);
                setSelectedIndex(0);
                if (e.target.value.trim()) setIsDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (searchResults.length > 0 || searchInput.trim()) setIsDropdownOpen(true); }}
              className="w-full pl-11 pr-24 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-blue-600 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all outline-hidden shadow-2xs"
            />

            <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    setIsDropdownOpen(false);
                    searchInputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  title="Clear Search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Instant Search Results Dropdown */}
          {isDropdownOpen && searchInput.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              
              {/* Category Filter Chips Header */}
              <div className="px-2 py-1.5 flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 mb-1 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Filter Category:
                </span>
                <div className="flex items-center gap-1">
                  {[
                    { id: 'ALL', label: 'All' },
                    { id: 'ARTICLES', label: 'Articles' },
                    { id: 'CUSTOMERS', label: 'Shopkeepers' },
                    { id: 'SUPPLIERS', label: 'Vendors' },
                    { id: 'DISPATCHES', label: 'Challans' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Items */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {searchResults.length === 0 ? (
                  <div className="py-6 text-center space-y-1">
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No matching records found for "{searchInput}"
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Try searching with another code, shopkeeper name, city, or challan number.
                    </p>
                  </div>
                ) : (
                  searchResults.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectResult(item)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                        idx === selectedIndex 
                          ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon badge per entity type */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          item.type === 'ARTICLE'
                            ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                            : item.type === 'CUSTOMER'
                            ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                            : item.type === 'SUPPLIER'
                            ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                            : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                        }`}>
                          {item.type === 'ARTICLE' && <Tag className="w-4 h-4" />}
                          {item.type === 'CUSTOMER' && <Store className="w-4 h-4" />}
                          {item.type === 'SUPPLIER' && <Globe className="w-4 h-4" />}
                          {item.type === 'DISPATCH' && <Truck className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {item.title}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                              {item.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.subtitle}
                          </div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {item.extra}
                          </div>
                        </div>
                      </div>

                      {/* Right Badge */}
                      <div className="text-right shrink-0 pl-2">
                        <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          item.badgeColor === 'emerald'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : item.badgeColor === 'rose'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                            : item.badgeColor === 'amber'
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Dropdown footer tip */}
              <div className="px-3 py-1.5 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-1">
                <span>Navigate: <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">↑</kbd> <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">↓</kbd> • Open: <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd></span>
                <span>Press <kbd className="px-1 py-0.2 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd> to dismiss</span>
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
