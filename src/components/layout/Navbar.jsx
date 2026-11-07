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
  Sparkles,
  Bell,
  AlertTriangle,
  ArrowDownLeft,
  Wallet,
  Clock
} from 'lucide-react';
import { showToast } from '../../utils/sweetalert';
import { getOverdueCustomerReminders } from '../../utils/paymentReminders';

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
    customerPayments,
    setSelectedArticleDetail,
    setSelectedCustomerKhata,
    setSelectedSupplierDetail,
    setSelectedDispatchForBill,
    setIsQuickSearchOpen,
    setActiveTab,
    setSecuritySubTab,
    setIsRecordCustomerPaymentOpen,
    setSelectedCustomerForPayment
  } = useApp();

  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const notifDropdownRef = useRef(null);
  const notifButtonRef = useRef(null);

  const [searchInput, setSearchInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL' | 'ARTICLES' | 'CUSTOMERS' | 'SUPPLIERS' | 'DISPATCHES'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifTab, setNotifTab] = useState('ALL'); // 'ALL' | 'STOCK' | 'TRANSACTIONS'
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

  // Close search dropdown on click outside
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

  // Close notification dropdown on click outside
  useEffect(() => {
    const handleClickOutsideNotif = (e) => {
      if (
        notifDropdownRef.current && 
        !notifDropdownRef.current.contains(e.target) &&
        notifButtonRef.current && 
        !notifButtonRef.current.contains(e.target)
      ) {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutsideNotif);
    }
    return () => document.removeEventListener('mousedown', handleClickOutsideNotif);
  }, [isNotificationOpen]);

  // Compute live notifications for the Bell icon
  const notifications = useMemo(() => {
    const list = [];

    // 1. Overdue Wasooli Reminders (10+ Days without customer payment)
    const overdueReminders = getOverdueCustomerReminders(customers, customerPayments, outward);
    overdueReminders.forEach(rem => {
      list.push({
        ...rem,
        action: () => {
          setSelectedCustomerKhata(rem.customer);
          setIsNotificationOpen(false);
        }
      });
    });

    // 2. Stock warnings (Articles with 50% or less stock)
    (articles || []).forEach(art => {
      const current = Number(art.currentStock) || 0;
      const initial = Number(art.totalPurchased) > 0 
        ? Number(art.totalPurchased) 
        : (current + (Number(art.totalOut) || 0));
      const percent = initial > 0 
        ? Math.min(100, Math.max(0, Math.round((current / initial) * 100))) 
        : (current === 0 ? 0 : 100);

      if (percent <= 50) {
        let badge = 'Below 50%';
        let badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
        let severity = 'warning';

        if (current <= 0 || percent <= 0) {
          badge = '0% Out of Stock!';
          badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse';
          severity = 'critical';
        } else if (percent <= 10) {
          badge = 'Below 10% Stock';
          badgeColor = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
          severity = 'critical';
        } else if (percent <= 20) {
          badge = 'Below 20% Stock';
          badgeColor = 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
          severity = 'high';
        } else if (percent <= 30) {
          badge = 'Below 30% Stock';
          badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
          severity = 'medium';
        } else if (percent <= 40) {
          badge = 'Below 40% Stock';
          badgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
          severity = 'low';
        }

        list.push({
          id: `stock-${art.articleNo}`,
          category: 'STOCK',
          severity,
          title: `${art.articleNo} — ${art.name || 'Garment'}`,
          badge,
          badgeColor,
          desc: `Sirf ${current.toLocaleString()} pcs bache hain (${percent}% stock remaining)`,
          time: art.warehouseLocation || 'Main Godown',
          action: () => {
            setSelectedArticleDetail(art);
            setIsNotificationOpen(false);
          }
        });
      }
    });

    // 3. Recent Wasooli (Payments received)
    (customerPayments || []).slice(0, 10).forEach(p => {
      const amt = Number(p.amount) || 0;
      list.push({
        id: `wasooli-${p.id}`,
        category: 'WASOOLI',
        severity: 'success',
        title: `Wasooli: Rs. ${amt.toLocaleString()}`,
        badge: 'Wasooli Recv.',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
        desc: `${p.customerName || 'Customer'} se wasooli mil gayi (${p.paymentMethod || 'Cash'})`,
        time: p.date || (p.createdAt ? p.createdAt.split('T')[0] : 'Recent'),
        action: () => {
          if (p.customerId) {
            const cust = customers.find(c => String(c.id) === String(p.customerId));
            if (cust) setSelectedCustomerKhata(cust);
          } else if (p.customerName) {
            const clean = p.customerName.split('(')[0].trim().toLowerCase();
            const cust = customers.find(c => c.shopName?.toLowerCase() === clean);
            if (cust) setSelectedCustomerKhata(cust);
          }
          setIsNotificationOpen(false);
        }
      });
    });

    // 4. Recent Bills (Dispatches)
    (outward || []).slice(0, 10).forEach(o => {
      const amt = Number(o.totalSaleAmount) || ((Number(o.quantity) || 0) * (Number(o.unitSalePrice) || 0));
      list.push({
        id: `bill-${o.id}`,
        category: 'BILL',
        severity: 'info',
        title: `Bill #${o.challanNo || o.id} Dispatched`,
        badge: 'Bill Dispatch',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        desc: `${o.customerName || 'Customer'} • Rs. ${amt.toLocaleString()} (${o.isWithoutStock ? 'Direct Sale' : `${o.quantity} pcs`})`,
        time: o.date || (o.createdAt ? o.createdAt.split('T')[0] : 'Recent'),
        action: () => {
          if (setSelectedDispatchForBill) setSelectedDispatchForBill(o);
          setIsNotificationOpen(false);
        }
      });
    });

    return list;
  }, [articles, customerPayments, outward, customers, setSelectedArticleDetail, setSelectedCustomerKhata, setSelectedDispatchForBill]);

  // Track dismissed notifications in state and localStorage so clicked items clear
  const [dismissedNotifIds, setDismissedNotifIds] = useState(() => {
    try {
      const saved = localStorage.getItem('kc_dismissed_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dismissNotification = (e, id) => {
    if (e) e.stopPropagation();
    setDismissedNotifIds(prev => {
      const updated = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('kc_dismissed_notifications', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
  };

  const clearAllNotifications = (e) => {
    if (e) e.stopPropagation();
    const allIds = notifications.map(n => n.id);
    setDismissedNotifIds(prev => {
      const updated = Array.from(new Set([...prev, ...allIds]));
      try {
        localStorage.setItem('kc_dismissed_notifications', JSON.stringify(updated));
      } catch (err) {
        console.error(err);
      }
      return updated;
    });
    showToast('All notifications cleared!', 'success');
  };

  // Active notifications (excluding ones the user clicked or dismissed)
  const activeNotifications = useMemo(() => {
    return notifications.filter(n => !dismissedNotifIds.includes(n.id));
  }, [notifications, dismissedNotifIds]);

  const overduePaymentsCount = useMemo(() => {
    return activeNotifications.filter(n => n.category === 'OVERDUE_PAYMENT').length;
  }, [activeNotifications]);

  const lowStockCount = useMemo(() => {
    return activeNotifications.filter(n => n.category === 'STOCK').length;
  }, [activeNotifications]);

  const filteredNotifs = useMemo(() => {
    if (notifTab === 'OVERDUE') return activeNotifications.filter(n => n.category === 'OVERDUE_PAYMENT');
    if (notifTab === 'STOCK') return activeNotifications.filter(n => n.category === 'STOCK');
    if (notifTab === 'TRANSACTIONS') return activeNotifications.filter(n => n.category === 'WASOOLI' || n.category === 'BILL');
    return activeNotifications;
  }, [activeNotifications, notifTab]);

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
            subtitle: `Contact: ${supp.contactPerson || '—'} (${supp.country || 'China'})`,
            extra: `Total Purchased: ${supp.totalPiecesSupplied || 0} pcs`,
            badge: bal > 0 ? `Baqaya: ¥${bal.toLocaleString()}` : 'Clear',
            badgeColor: bal > 0 ? 'amber' : 'emerald',
            data: supp
          });
        }
      });
    }

    // 4. Outward Dispatches
    if (selectedCategory === 'ALL' || selectedCategory === 'DISPATCHES') {
      outward.forEach(disp => {
        if (
          disp.challanNo?.toLowerCase().includes(q) ||
          disp.customerName?.toLowerCase().includes(q) ||
          disp.articleNo?.toLowerCase().includes(q) ||
          disp.city?.toLowerCase().includes(q)
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
            className="w-9 h-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
            title="Toggle Menu Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <img 
              src={logoImg} 
              alt="Khan Jacket House" 
              className="h-9 w-auto object-contain drop-shadow-2xs" 
            />
            <div className="hidden sm:block">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white block uppercase leading-tight font-serif">
                Khan Jacket House
              </span>
              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 tracking-wider uppercase block">
                China Import & Wholesale Portal
              </span>
            </div>
          </div>
        </div>

        {/* Center: Universal Fast Search Bar */}
        <div className="relative flex-1 max-w-lg mx-4 hidden md:block">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setIsDropdownOpen(true);
                setSelectedIndex(0);
              }}
              onFocus={() => {
                if (searchInput.trim()) setIsDropdownOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search Article, Shopkeeper / Khata, Vendor, Challan # (Ctrl+K)..."
              className="w-full pl-10 pr-12 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
            />
            
            {/* Quick Clear or Keyboard Shortcut Pill */}
            {searchInput ? (
              <button
                onClick={() => {
                  setSearchInput('');
                  setIsDropdownOpen(false);
                }}
                className="absolute right-3 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-3 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-500 dark:text-slate-400 pointer-events-none border border-slate-300/60 dark:border-slate-600/60">
                ⌘K
              </span>
            )}
          </div>

          {/* Search Dropdown Results Panel */}
          {isDropdownOpen && searchInput.trim() && (
            <div 
              ref={dropdownRef}
              className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
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

        {/* Right: Theme Toggle, Notifications Bell, Audit History & Profile Avatar */}
        <div className="flex items-center gap-2.5">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="px-3 py-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
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

          {/* Notifications Bell with Interactive Dropdown (User's Marked Red Line) */}
          <div className="relative">
            <button
              ref={notifButtonRef}
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all shadow-2xs relative cursor-pointer ${
                isNotificationOpen
                  ? 'bg-blue-50 dark:bg-slate-800 border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
              }`}
              title="Notifications & Alerts"
            >
              <Bell className="w-4 h-4" />
              {activeNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-pulse">
                  {activeNotifications.length > 9 ? '9+' : activeNotifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotificationOpen && (
              <div 
                ref={notifDropdownRef}
                className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Dropdown Header */}
                <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Notifications & Alerts
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {overduePaymentsCount > 0 && (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{overduePaymentsCount} Overdue Wasooli • </span>
                        )}
                        {lowStockCount} Low Stock • {activeNotifications.length} Active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Clear all active notifications"
                      >
                        Clear All
                      </button>
                    )}
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsNotificationOpen(false);
                        setActiveTab('announcements');
                        navigate('/announcements');
                      }}
                      className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      View All →
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs: All | Overdue Wasooli | Stock Warnings | Wasooli & Bills */}
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 bg-white dark:bg-slate-900 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setNotifTab('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                      notifTab === 'ALL'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All ({activeNotifications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifTab('OVERDUE')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                      notifTab === 'OVERDUE'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-rose-500" />
                    <span>Overdue Wasooli ({overduePaymentsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifTab('STOCK')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                      notifTab === 'STOCK'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Stock ({lowStockCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifTab('TRANSACTIONS')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 ${
                      notifTab === 'TRANSACTIONS'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Wasooli & Bills
                  </button>
                </div>

                {/* Notifications Feed Items */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredNotifs.length === 0 ? (
                    <div className="py-8 text-center space-y-1">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        No notifications in this filter
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Everything is healthy and up to date!
                      </p>
                    </div>
                  ) : (
                    filteredNotifs.slice(0, 15).map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          dismissNotification(null, n.id);
                          n.action();
                        }}
                        className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-start gap-3 group relative"
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.category === 'OVERDUE_PAYMENT' && (
                            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-rose-600" />
                            </div>
                          )}
                          {n.category === 'STOCK' && (
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center justify-center">
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {n.category === 'WASOOLI' && (
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </div>
                          )}
                          {n.category === 'BILL' && (
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center">
                              <Truck className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {n.title}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${n.badgeColor}`}>
                              {n.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                            {n.desc}
                          </p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {n.time}
                            </span>
                            {n.category === 'OVERDUE_PAYMENT' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(null, n.id);
                                  if (setSelectedCustomerForPayment) setSelectedCustomerForPayment(n.customer);
                                  if (setIsRecordCustomerPaymentOpen) setIsRecordCustomerPaymentOpen(true);
                                  setIsNotificationOpen(false);
                                }}
                                className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs transition-colors shrink-0 flex items-center gap-1"
                                title="Record payment from this customer"
                              >
                                <Wallet className="w-3 h-3" />
                                <span>+ Wasooli</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Dismiss single notification button on hover */}
                        <button
                          type="button"
                          onClick={(e) => dismissNotification(e, n.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-all shrink-0 cursor-pointer self-center"
                          title="Dismiss / remove notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Link to Full Announcements */}
                <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationOpen(false);
                      setActiveTab('announcements');
                      navigate('/announcements');
                    }}
                    className="w-full py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    Open Full Announcements & Tables Dashboard →
                  </button>
                </div>
              </div>
            )}
          </div>

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
