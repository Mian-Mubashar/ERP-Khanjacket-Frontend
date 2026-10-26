import React from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { BranchesView } from './components/cities/BranchesView';
import { CustomersView } from './components/customers/CustomersView';
import { ArticlesList } from './components/articles/ArticlesList';
import { PurchasesList } from './components/purchases/PurchasesList';
import { OutwardList } from './components/outward/OutwardList';
import { SuppliersList } from './components/suppliers/SuppliersList';
import { ReportsView } from './components/reports/ReportsView';
import { SecurityView } from './components/security/SecurityView';
import { LoginView } from './components/auth/LoginView';

// Modals
import { ArticleDetailModal } from './components/articles/ArticleDetailModal';
import { AddArticleModal } from './components/articles/AddArticleModal';
import { EditArticleModal } from './components/articles/EditArticleModal';
import { AddStuffModal } from './components/articles/AddStuffModal';
import { AddCategoryModal } from './components/articles/AddCategoryModal';
import { AddLocationModal } from './components/articles/AddLocationModal';
import { AddCustomerModal } from './components/customers/AddCustomerModal';
import { EditCustomerModal } from './components/customers/EditCustomerModal';
import { RecordCustomerPaymentModal } from './components/customers/RecordCustomerPaymentModal';
import { CustomerStatementModal } from './components/customers/CustomerStatementModal';
import { NewPurchaseModal } from './components/purchases/NewPurchaseModal';
import { NewOutwardModal } from './components/outward/NewOutwardModal';
import { AddSupplierModal } from './components/suppliers/AddSupplierModal';
import { EditSupplierModal } from './components/suppliers/EditSupplierModal';
import { AddPaymentModal } from './components/suppliers/AddPaymentModal';
import { SupplierStatementModal } from './components/suppliers/SupplierStatementModal';
import { QuickArticleSearchModal } from './components/common/QuickArticleSearchModal';

/**
 * Premium Branded Loading Screen during initial JWT token verification
 */
const AuthLoadingScreen = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 font-sans text-white p-6 select-none">
      <div className="relative flex flex-col items-center">
        {/* Ambient Glow */}
        <div className="absolute w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none -top-10" />

        {/* Animated Brand Badge */}
        <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-blue-500/25 border border-white/20 mb-6">
          <span className="tracking-wider">KC</span>
          <div className="absolute -inset-1 rounded-2xl border border-blue-400/40 animate-ping opacity-60" />
        </div>

        {/* Brand Text */}
        <h2 className="relative z-10 text-xl font-extrabold tracking-wider text-white uppercase text-center">
          KHAN CLOTHES
        </h2>
        <p className="relative z-10 text-xs font-semibold text-emerald-400 tracking-widest uppercase mt-1">
          Central Warehouse & Imports ERP
        </p>

        {/* Security / Backend verification status */}
        <div className="relative z-10 mt-8 flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs">
          <div className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span>Verifying secure session with backend server...</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Protected Route Wrapper: Requires valid backend JWT authentication
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, currentUser, isAuthLoading } = useApp();
  const location = useLocation();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || !currentUser) {
    // Redirect to login page and preserve requested destination
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children ? children : <Outlet />;
};

/**
 * Public Only Route Wrapper: Prevents logged in users from seeing /login
 */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, currentUser, isAuthLoading } = useApp();
  const location = useLocation();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated && currentUser) {
    const destination = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
};

/**
 * Main Authenticated Warehouse Layout with Navbar, Sidebar, and Global Modals
 */
const DashboardLayout = () => {
  const { activeTab, setActiveTab } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <Navbar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Sidebar with synchronized URL navigation */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        {/* Content Area Rendered by React Router */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Global Interactive Modals */}
      {/* 1. Base Ledger and Action Modals (z-50) */}
      <ArticleDetailModal />
      <CustomerStatementModal />
      <SupplierStatementModal />
      <AddArticleModal />
      <AddCustomerModal />
      <AddSupplierModal />
      <NewPurchaseModal />
      <NewOutwardModal />
      <QuickArticleSearchModal />

      {/* 2. Secondary & Edit Modals (z-[60]) */}
      <EditArticleModal />
      <EditCustomerModal />
      <EditSupplierModal />
      <RecordCustomerPaymentModal />
      <AddPaymentModal />

      {/* 3. Nested Dialogs (z-[70]) */}
      <AddStuffModal />
      <AddCategoryModal />
      <AddLocationModal />
    </div>
  );
};

const AppRoutes = () => {
  const { setActiveTab } = useApp();

  return (
    <Routes>
      {/* Public Login Route (Address bar explicitly shows /login) */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginView />
          </PublicOnlyRoute>
        }
      />

      {/* Protected Routes (Authenticated via Backend JWT) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardOverview setActiveTab={setActiveTab} />} />
        <Route path="/branches" element={<BranchesView />} />
        <Route path="/customers" element={<CustomersView />} />
        <Route path="/articles" element={<ArticlesList />} />
        <Route path="/purchases" element={<PurchasesList />} />
        <Route path="/outward" element={<OutwardList />} />
        <Route path="/suppliers" element={<SuppliersList />} />
        <Route path="/reports" element={<ReportsView />} />
        <Route path="/security" element={<SecurityView />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
};

export default App;
