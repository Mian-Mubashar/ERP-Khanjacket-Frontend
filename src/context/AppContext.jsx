import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, getAuthToken, setAuthToken } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('kc_theme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Apply theme class to <html>
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('kc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sidebar collapsed state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  // Authentication State
  const [token, setToken] = useState(() => getAuthToken());
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('kc_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const isAuthenticated = Boolean(token && currentUser);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Derive active tab dynamically from current URL pathname
  const getTabFromPath = useCallback((pathname) => {
    const segment = pathname.replace(/^\//, '').split('/')[0];
    const validTabs = ['dashboard', 'branches', 'customers', 'articles', 'purchases', 'outward', 'suppliers', 'reports', 'security'];
    return validTabs.includes(segment) ? segment : 'dashboard';
  }, []);

  const activeTab = getTabFromPath(location.pathname);

  const setActiveTab = useCallback((tab) => {
    navigate(`/${tab}`);
  }, [navigate]);

  // Securely verify JWT session with Backend /auth/me on initial app boot or refresh
  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      const storedToken = getAuthToken();
      if (!storedToken) {
        if (isMounted) {
          setIsAuthLoading(false);
          setIsBackendConnected(false);
        }
        return;
      }

      try {
        const res = await api.auth.getMe();
        if (isMounted && res?.data) {
          setCurrentUser(res.data);
          localStorage.setItem('kc_user', JSON.stringify(res.data));
          setIsBackendConnected(true);
        }
      } catch (err) {
        console.warn('[AppContext] Secure token verification failed:', err.message);
        if (isMounted) {
          setAuthToken(null);
          setToken(null);
          setCurrentUser(null);
          localStorage.removeItem('kc_user');
          setIsBackendConnected(false);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen for global unauthorized 401 events
  useEffect(() => {
    const handleUnauthorized = () => {
      setAuthToken(null);
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('kc_user');
      navigate('/login', { replace: true });
    };

    window.addEventListener('kc:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('kc:unauthorized', handleUnauthorized);
  }, [navigate]);

  // Clean legacy static mock caches from localStorage on boot
  useEffect(() => {
    const legacyCleaned = localStorage.getItem('kc_pure_dynamic_mode_v1');
    if (!legacyCleaned) {
      [
        'kc_articles',
        'kc_suppliers',
        'kc_purchases',
        'kc_outward',
        'kc_payments',
        'kc_devices',
        'kc_audit_logs',
        'kc_categories',
        'kc_cities',
        'kc_stuffs',
        'kc_customers',
        'kc_customer_payments'
      ].forEach(k => localStorage.removeItem(k));
      localStorage.setItem('kc_pure_dynamic_mode_v1', 'true');
    }
  }, []);

  // Pure Dynamic Core Data States (Empty by default, populated only from MySQL DB)
  const [articles, setArticles] = useState([]);
  const [stuffs, setStuffs] = useState([]);
  const [cities, setCities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [outward, setOutward] = useState([]);
  const [payments, setPayments] = useState([]);
  const [devices, setDevices] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [warehouseLocations, setWarehouseLocations] = useState([]);

  // SubTab & Modals visibility
  const [securitySubTab, setSecuritySubTab] = useState('devices');

  const [selectedArticleDetail, setSelectedArticleDetail] = useState(null);
  const [selectedArticleForOutward, setSelectedArticleForOutward] = useState(null);
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState(null);
  const [selectedSupplierForPayment, setSelectedSupplierForPayment] = useState(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);
  const [selectedCustomerKhata, setSelectedCustomerKhata] = useState(null);
  const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState(null);
  const [selectedCustomerForBill, setSelectedCustomerForBill] = useState(null);
  const [editingCity, setEditingCity] = useState(null);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const [quickSearchTerm, setQuickSearchTerm] = useState('');

  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [isNewOutwardOpen, setIsNewOutwardOpen] = useState(false);
  const [isAddArticleOpen, setIsAddArticleOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [isEditArticleOpen, setIsEditArticleOpen] = useState(false);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [isRecordCustomerPaymentOpen, setIsRecordCustomerPaymentOpen] = useState(false);
  const [isAddStuffOpen, setIsAddStuffOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [customerFilterKey, setCustomerFilterKey] = useState(0);

  // ==========================================
  // FETCH LIVE DATA DYNAMICALLY FROM MYSQL
  // ==========================================
  const refreshData = useCallback(async () => {
    if (!token) return;
    setIsDataLoading(true);

    try {
      await api.health();
      setIsBackendConnected(true);

      const [
        articlesRes,
        suppliersRes,
        customersRes,
        purchasesRes,
        outwardRes,
        citiesRes,
        stuffsRes,
        categoriesRes,
        locationsRes,
        devicesRes,
        auditRes,
        customerPaymentsRes,
        supplierPaymentsRes
      ] = await Promise.allSettled([
        api.articles.list(),
        api.suppliers.list(),
        api.customers.list(),
        api.purchases.list(),
        api.outward.list(),
        api.cities.list(),
        api.stuffs.list(),
        api.stuffs.listCategories(),
        api.locations.list(),
        api.devices.list(),
        api.audit.list({ limit: 100 }),
        api.customers.listPayments(),
        api.suppliers.listPayments()
      ]);

      if (articlesRes.status === 'fulfilled' && articlesRes.value?.data) {
        setArticles(articlesRes.value.data);
      }
      if (suppliersRes.status === 'fulfilled' && suppliersRes.value?.data) {
        const sortedSuppliers = [...suppliersRes.value.data].sort((a, b) => 
          (a.company || a.name || '').localeCompare(b.company || b.name || '', undefined, { sensitivity: 'base' })
        );
        setSuppliers(sortedSuppliers);
      }
      if (customersRes.status === 'fulfilled' && customersRes.value?.data) {
        const sortedCustomers = [...customersRes.value.data].sort((a, b) => 
          (a.shopName || '').localeCompare(b.shopName || '', undefined, { sensitivity: 'base' })
        );
        setCustomers(sortedCustomers);
      }
      if (purchasesRes.status === 'fulfilled' && purchasesRes.value?.data) {
        setPurchases(purchasesRes.value.data);
      }
      if (outwardRes.status === 'fulfilled' && outwardRes.value?.data) {
        setOutward(outwardRes.value.data);
      }
      if (citiesRes.status === 'fulfilled' && citiesRes.value?.data) {
        setCities(citiesRes.value.data);
      }
      if (stuffsRes.status === 'fulfilled' && stuffsRes.value?.data) {
        setStuffs(stuffsRes.value.data);
      }
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value?.data) {
        setCategories(categoriesRes.value.data);
      }
      if (locationsRes.status === 'fulfilled' && locationsRes.value?.data) {
        setWarehouseLocations(locationsRes.value.data);
      }
      if (devicesRes.status === 'fulfilled' && devicesRes.value?.data) {
        setDevices(devicesRes.value.data);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value?.data) {
        setAuditLogs(auditRes.value.data);
      }
      if (customerPaymentsRes.status === 'fulfilled' && customerPaymentsRes.value?.data) {
        setCustomerPayments(customerPaymentsRes.value.data);
      }
      if (supplierPaymentsRes.status === 'fulfilled' && supplierPaymentsRes.value?.data) {
        setPayments(supplierPaymentsRes.value.data);
      }
    } catch (err) {
      console.warn('[AppContext] Backend offline or unreachable:', err.message);
      setIsBackendConnected(false);
    } finally {
      setIsDataLoading(false);
    }
  }, [token]);

  // Load data immediately upon authentication
  useEffect(() => {
    if (isAuthenticated && !isAuthLoading) {
      refreshData();
    }
  }, [isAuthenticated, isAuthLoading, refreshData]);

  // ==========================================
  // AUTHENTICATION: LOGIN & LOGOUT
  // ==========================================
  const login = async (email, password) => {
    try {
      const res = await api.auth.login(email, password);
      if (res?.success && res?.data?.token) {
        const user = res.data.user;
        setAuthToken(res.data.token);
        setToken(res.data.token);
        setCurrentUser(user);
        localStorage.setItem('kc_user', JSON.stringify(user));
        setIsBackendConnected(true);
        refreshData();
        return { success: true, user };
      }
      return { success: false, message: res?.message || 'Login failed' };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Unable to connect to warehouse server.'
      };
    }
  };

  const logout = () => {
    api.auth.logout();
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('kc_user');
    navigate('/login', { replace: true });
  };

  // Add Local Audit Log for UI display
  const addAuditLog = (action, category, details, impact) => {
    const newLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(',', ''),
      userName: currentUser ? `${currentUser.role} (${currentUser.name})` : 'Admin',
      userRole: currentUser?.role || 'Admin',
      action,
      category,
      details,
      impact
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // ==========================================
  // DYNAMIC ACTIONS: ARTICLES (PERSIST TO MYSQL)
  // ==========================================
  const addArticle = async (articleData) => {
    try {
      const res = await api.articles.create(articleData);
      if (res?.success && res?.data) {
        await refreshData();
        return { success: true, article: res.data };
      }
      return { success: false, message: res?.message || 'Failed to create article in database' };
    } catch (err) {
      return { success: false, message: err.message || 'Error saving article to MySQL database' };
    }
  };

  const updateArticle = async (articleNo, updateData) => {
    try {
      const res = await api.articles.update(articleNo, updateData);
      if (res?.success && res?.data) {
        await refreshData();
        return { success: true, article: res.data };
      }
      return { success: false, message: res?.message || 'Failed to update article' };
    } catch (err) {
      return { success: false, message: err.message || 'Error updating article in MySQL database' };
    }
  };

  const deleteArticle = async (articleNo) => {
    try {
      const res = await api.articles.delete(articleNo);
      if (res?.success) {
        await refreshData();
        return { success: true, message: res?.message || 'Article deleted successfully' };
      }
      return { success: false, message: res?.message || 'Failed to delete article' };
    } catch (err) {
      return { success: false, message: err?.data?.message || err.message || 'Error deleting article from database' };
    }
  };

  // ==========================================
  // DYNAMIC ACTIONS: PURCHASES (CHINA IMPORT)
  // ==========================================
  const addPurchase = async (purchaseData) => {
    try {
      const res = await api.purchases.create(purchaseData);
      if (res?.success && res?.data) {
        await refreshData(); // Auto re-sync articles, stock, supplier ledger, and payments from MySQL
        return { success: true, purchase: res.data };
      }
      return { success: false, message: res?.message || 'Failed to save purchase bill in database' };
    } catch (err) {
      return { success: false, message: err.message || 'Error saving purchase to MySQL database' };
    }
  };

  // ==========================================
  // DYNAMIC ACTIONS: OUTWARD DISPATCHES
  // ==========================================
  const addOutward = async (outwardData) => {
    try {
      const res = await api.outward.create(outwardData);
      if (res?.success && res?.data) {
        await refreshData(); // Auto re-sync decremented stock, customer khata, and outward records from MySQL
        return { success: true, outward: res.data };
      }
      return { success: false, message: res?.message || 'Failed to record outward dispatch' };
    } catch (err) {
      return { success: false, message: err.message || 'Error recording outward dispatch in MySQL' };
    }
  };

  // ==========================================
  // DYNAMIC ACTIONS: SUPPLIERS & VENDOR PAYMENTS
  // ==========================================
  const addSupplier = async (supplierData) => {
    try {
      const res = await api.suppliers.create(supplierData);
      if (res?.success && res?.data) {
        await refreshData();
        return { success: true, supplier: res.data };
      }
      return { success: false, message: res?.message || 'Failed to register supplier' };
    } catch (err) {
      return { success: false, message: err.message || 'Error saving supplier to MySQL' };
    }
  };

  const updateSupplier = async (id, updateData) => {
    try {
      const res = await api.suppliers.update(id, updateData);
      if (res?.success) {
        await refreshData();
        return { success: true, supplier: res.data };
      }
      return { success: false, message: res?.message || 'Failed to update supplier' };
    } catch (err) {
      return { success: false, message: err.message || 'Error updating supplier in MySQL' };
    }
  };

  const recordPayment = async (paymentData) => {
    try {
      const res = await api.suppliers.recordPayment(paymentData);
      if (res?.success && res?.data) {
        await refreshData(); // Auto update remaining supplier balance from MySQL
        addAuditLog(
          'Supplier Payment Recorded',
          'Supplier Payment',
          `Paid Rs. ${Number(paymentData.amount).toLocaleString()} to vendor`,
          `Recorded in MySQL ledger`
        );
        return { success: true, payment: res.data };
      }
      return { success: false, message: res?.message || 'Failed to record payment' };
    } catch (err) {
      return { success: false, message: err.message || 'Error recording payment in MySQL' };
    }
  };

  // ==========================================
  // DYNAMIC ACTIONS: CUSTOMERS & SHOPKEEPER KHATA
  // ==========================================
  const addCustomer = async (custData) => {
    try {
      const res = await api.customers.create(custData);
      if (res?.success && res?.data) {
        setCustomers(prev => [...prev.filter(c => c.id !== res.data.id), res.data].sort((a, b) => 
          (a.shopName || '').localeCompare(b.shopName || '', undefined, { sensitivity: 'base' })
        ));
        setCustomerFilterKey(prev => prev + 1);
        await refreshData();
        addAuditLog(
          'Shopkeeper Registered', 
          'Wholesale Customers', 
          `Added shop ${res.data.shopName} in ${res.data.city}`, 
          `Saved to MySQL Khata`
        );
        return { success: true, customer: res.data };
      }
      return { success: false, message: res?.message || 'Failed to register customer' };
    } catch (err) {
      return { success: false, message: err.message || 'Error saving customer to MySQL' };
    }
  };

  const updateCustomer = async (id, data) => {
    try {
      const res = await api.customers.update(id, data);
      if (res?.success) {
        await refreshData();
        return { success: true };
      }
      return { success: false, message: res?.message || 'Failed to update customer' };
    } catch (err) {
      return { success: false, message: err.message || 'Error updating customer in MySQL' };
    }
  };

  const deleteCustomer = async (id) => {
    try {
      const res = await api.customers.delete(id);
      if (res?.success) {
        setCustomers(prev => prev.filter(c => c.id !== id));
        await refreshData();
        return { success: true };
      }
      return { success: false, message: res?.message || 'Failed to delete customer' };
    } catch (err) {
      return { success: false, message: err.message || 'Error deleting customer from MySQL' };
    }
  };

  const recordCustomerPayment = async (paymentData) => {
    try {
      const res = await api.customers.recordPayment(paymentData);
      if (res?.success && res?.data) {
        await refreshData(); // Auto reduce outstanding customer khata balance from MySQL
        addAuditLog(
          'Customer Payment Received',
          'Customer Khata',
          `Received payment of Rs. ${Number(paymentData.amount).toLocaleString()}`,
          `Recorded in MySQL ledger`
        );
        return { success: true, payment: res.data };
      }
      return { success: false, message: res?.message || 'Failed to record customer receipt' };
    } catch (err) {
      return { success: false, message: err.message || 'Error recording customer receipt in MySQL' };
    }
  };

  // ==========================================
  // DYNAMIC ACTIONS: CITIES & STUFFS
  // ==========================================
  const addCity = async ({ name }) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'City name is required' };
    try {
      const res = await api.cities.create({ name: trimmed });
      if (res?.success && res?.data) {
        setCities(prev => [...prev, res.data]);
        return { success: true, city: res.data };
      }
      return { success: false, message: res?.message || 'Failed to add branch' };
    } catch (err) {
      return { success: false, message: err.message || 'Error adding city branch to MySQL' };
    }
  };

  const updateCity = async (id, { name }) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'City name is required' };
    try {
      const res = await api.cities.update(id, { name: trimmed });
      if (res?.success && res?.data) {
        setCities(prev => prev.map(c => c.id === id ? res.data : c));
        return { success: true, city: res.data };
      }
      return { success: false, message: res?.message || 'Failed to rename branch' };
    } catch (err) {
      return { success: false, message: err.message || 'Error updating city branch in MySQL' };
    }
  };

  const deleteCity = async (id) => {
    try {
      const res = await api.cities.delete(id);
      if (res?.success) {
        setCities(prev => prev.filter(c => c.id !== id));
        return { success: true };
      }
      return { success: false, message: res?.message || 'Failed to delete branch' };
    } catch (err) {
      return { success: false, message: err.message || 'Error deleting city branch from MySQL' };
    }
  };

  const addStuff = async (stuffName) => {
    const trimmed = stuffName.trim();
    if (!trimmed) return { success: false, message: 'Stuff / fabric name is required' };
    try {
      const res = await api.stuffs.create(trimmed);
      if (res?.success && res?.data) {
        setStuffs(prev => [...prev, res.data]);
        return { success: true, stuff: res.data };
      }
      return { success: false, message: res?.message || 'Failed to add fabric' };
    } catch (err) {
      return { success: false, message: err.message || 'Error adding fabric to MySQL' };
    }
  };

  const addCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    if (!trimmed) return { success: false, message: 'Category name is required' };
    try {
      const res = await api.stuffs.createCategory(trimmed);
      if (res?.success && res?.data) {
        setCategories(prev => {
          if (prev.includes(res.data)) return prev;
          return [...prev, res.data].sort();
        });
        return { success: true, category: res.data };
      }
      return { success: false, message: res?.message || 'Failed to add category' };
    } catch (err) {
      return { success: false, message: err.message || 'Error adding category to database' };
    }
  };

  const updateCategory = async (oldName, newName) => {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();
    if (!trimmedNew) return { success: false, message: 'New category name is required' };
    try {
      const res = await api.stuffs.updateCategory(trimmedOld, trimmedNew);
      if (res?.success) {
        setCategories(prev => prev.map(c => c === trimmedOld ? trimmedNew : c).sort());
        await refreshData();
        return { success: true, category: trimmedNew };
      }
      return { success: false, message: res?.message || 'Failed to update category' };
    } catch (err) {
      return { success: false, message: err.message || 'Error updating category in database' };
    }
  };

  const deleteCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    try {
      const res = await api.stuffs.deleteCategory(trimmed);
      if (res?.success) {
        setCategories(prev => prev.filter(c => c !== trimmed));
        await refreshData();
        return { success: true };
      }
      return { success: false, message: res?.message || 'Failed to delete category' };
    } catch (err) {
      return { success: false, message: err.message || 'Error deleting category from database' };
    }
  };

  const addWarehouseLocation = async (locationName) => {
    const trimmed = locationName.trim();
    if (!trimmed) return { success: false, message: 'Warehouse location / rack name is required' };
    try {
      const res = await api.locations.create(trimmed);
      if (res?.success && res?.data) {
        setWarehouseLocations(prev => {
          if (prev.includes(res.data)) return prev;
          return [...prev, res.data].sort();
        });
        return { success: true, location: res.data };
      }
      return { success: false, message: res?.message || 'Failed to add location' };
    } catch (err) {
      return { success: false, message: err.message || 'Error adding warehouse location to database' };
    }
  };

  const deleteWarehouseLocation = async (locationName) => {
    const trimmed = locationName.trim();
    try {
      const res = await api.locations.delete(trimmed);
      if (res?.success) {
        setWarehouseLocations(prev => prev.filter(l => l !== trimmed));
        await refreshData();
        return { success: true };
      }
      return { success: false, message: res?.message || 'Failed to delete warehouse location' };
    } catch (err) {
      return { success: false, message: err.message || 'Error deleting location from database' };
    }
  };

  // ==========================================
  // DYNAMIC ACTIONS: HARDWARE DEVICES
  // ==========================================
  const toggleDeviceStatus = async (deviceId) => {
    try {
      const res = await api.devices.toggle(deviceId);
      if (res?.success && res?.data) {
        setDevices(prev => prev.map(d => d.id === deviceId ? res.data : d));
        return { success: true, device: res.data };
      }
      return { success: false, message: res?.message || 'Failed to toggle device access' };
    } catch (err) {
      return { success: false, message: err.message || 'Error updating device status in MySQL' };
    }
  };

  const addDevice = async (deviceData) => {
    try {
      const res = await api.devices.create(deviceData);
      if (res?.success && res?.data) {
        setDevices(prev => [...prev, res.data]);
        return { success: true, device: res.data };
      }
      return { success: false, message: res?.message || 'Failed to authorize device' };
    } catch (err) {
      return { success: false, message: err.message || 'Error authorizing device in MySQL' };
    }
  };

  // Switch User Role
  const switchRole = async (newRole) => {
    try {
      const res = await api.auth.switchRole(newRole);
      if (res?.data?.user) {
        setCurrentUser(res.data.user);
        localStorage.setItem('kc_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      setCurrentUser(prev => ({
        ...prev,
        role: newRole,
        name: newRole === 'Admin' ? 'Admin Khan' : newRole === 'Staff' ? 'Tariq Mehmood (Staff)' : 'Auditor (Viewer)'
      }));
    }
  };

  return (
    <AppContext.Provider
      value={{
        // Theme
        theme,
        toggleTheme,

        // Sidebar
        sidebarCollapsed,
        toggleSidebar,

        // Authentication & Live Backend Status
        isAuthenticated,
        currentUser,
        isAuthLoading,
        login,
        logout,
        isBackendConnected,
        isDataLoading,
        refreshData,

        // Pure Dynamic Database States
        articles,
        stuffs,
        cities,
        customers,
        customerPayments,
        suppliers,
        purchases,
        outward,
        payments,
        devices,
        auditLogs,
        categories,
        warehouseLocations,
        setWarehouseLocations,

        // Dynamic MySQL Persistence Actions
        addArticle,
        updateArticle,
        deleteArticle,
        addCategory,
        updateCategory,
        deleteCategory,
        addWarehouseLocation,
        deleteWarehouseLocation,
        addStuff,
        addCity,
        updateCity,
        deleteCity,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        recordCustomerPayment,
        addSupplier,
        updateSupplier,
        addPurchase,
        addOutward,
        recordPayment,
        toggleDeviceStatus,
        addDevice,
        switchRole,

        // Modal Controls & Selected entities
        selectedArticleDetail,
        setSelectedArticleDetail,
        selectedArticleForOutward,
        setSelectedArticleForOutward,
        selectedSupplierDetail,
        setSelectedSupplierDetail,
        selectedSupplierForPayment,
        setSelectedSupplierForPayment,
        selectedInvoiceDetail,
        setSelectedInvoiceDetail,
        selectedCustomerKhata,
        setSelectedCustomerKhata,
        selectedCustomerForPayment,
        setSelectedCustomerForPayment,
        selectedCustomerForBill,
        setSelectedCustomerForBill,
        editingCity,
        setEditingCity,

        isQuickSearchOpen,
        setIsQuickSearchOpen,
        quickSearchTerm,
        setQuickSearchTerm,

        isNewPurchaseOpen,
        setIsNewPurchaseOpen,
        isNewOutwardOpen,
        setIsNewOutwardOpen,
        isAddArticleOpen,
        setIsAddArticleOpen,
        editingArticle,
        setEditingArticle,
        isEditArticleOpen,
        setIsEditArticleOpen,
        isAddSupplierOpen,
        setIsAddSupplierOpen,
        editingSupplier,
        setEditingSupplier,
        isEditSupplierOpen,
        setIsEditSupplierOpen,
        isRecordPaymentOpen,
        setIsRecordPaymentOpen,
        isSecurityModalOpen,
        setIsSecurityModalOpen,
        isAuditModalOpen,
        setIsAuditModalOpen,
        isAddCityOpen,
        setIsAddCityOpen,
        isAddCustomerOpen,
        setIsAddCustomerOpen,
        editingCustomer,
        setEditingCustomer,
        isEditCustomerOpen,
        setIsEditCustomerOpen,
        isRecordCustomerPaymentOpen,
        setIsRecordCustomerPaymentOpen,
        isAddStuffOpen,
        setIsAddStuffOpen,
        isAddCategoryOpen,
        setIsAddCategoryOpen,
        isAddLocationOpen,
        setIsAddLocationOpen,
        customerFilterKey,
        securitySubTab,
        setSecuritySubTab,
        activeTab,
        setActiveTab
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
