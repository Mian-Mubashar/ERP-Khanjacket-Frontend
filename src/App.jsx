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
import logoImg from './images/khan jacket logo.png';

/**
 * Premium Branded Loading Screen during initial JWT token verification
 */
const AuthLoadingScreen = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 font-sans text-white p-6 select-none">
      <div className="relative flex flex-col items-center">
        {/* Ambient Glow */}
        <div className="absolute w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none -top-10" />

        {/* Brand Logo - Clean with No White Box or Border */}
        <div className="relative z-10 mb-6 flex items-center justify-center">
          <img
            src={logoImg}
            alt="Khan Jacket House Logo"
            className="h-20 sm:h-24 w-auto object-contain drop-shadow-2xl animate-pulse"
          />
        </div>

        {/* Security / Backend verification status */}
        <div className="relative z-10 mt-2 flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs">
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
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden flex flex-col justify-between">
          <div className="flex-1">
            <Outlet />
          </div>

          {/* Global Application Footer on Every Page */}
          <footer className="pt-6 pb-4 mt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            <div className="font-bold tracking-wider uppercase text-slate-800 dark:text-slate-100 text-sm sm:text-base">
              KHAN JACKET HOUSE
            </div>
            <div className="text-center sm:text-right font-medium">
              Copyright &copy; 2026. All rights reserved. Powered by{' '}
              <a
                href="https://mubasharportfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black dark:text-white font-bold text-sm sm:text-base transition-colors duration-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline underline-offset-4 cursor-pointer"
                title="Mubashar Portfolio"
              >
                Mubashar
              </a>
              .
            </div>
          </footer>
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
