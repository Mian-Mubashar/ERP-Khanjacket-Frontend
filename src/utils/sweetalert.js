import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * Check if dark mode is active
 */
const isDarkMode = () => {
  return document.documentElement.classList.contains('dark');
};

/**
 * Common modal configuration to match the executive UI
 */
const getBaseConfig = () => {
  const dark = isDarkMode();
  return {
    background: dark ? '#0f172a' : '#ffffff',
    color: dark ? '#f8fafc' : '#0f172a',
    backdrop: `rgba(15, 23, 42, ${dark ? '0.75' : '0.5'})`,
    customClass: {
      popup: 'rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl font-sans',
      title: 'text-lg font-extrabold text-slate-900 dark:text-white',
      htmlContainer: 'text-sm text-slate-600 dark:text-slate-400 font-medium',
      confirmButton: 'px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-102',
      cancelButton: 'px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer transition-transform hover:scale-102 ml-2'
    },
    buttonsStyling: true
  };
};

/**
 * Beautiful confirmation modal for delete actions
 * @returns {Promise<boolean>} resolves to true if confirmed
 */
export const confirmDelete = async ({
  title = 'Are you sure?',
  text = 'This action cannot be undone!',
  confirmButtonText = 'Yes, Delete It',
  cancelButtonText = 'Cancel'
} = {}) => {
  const base = getBaseConfig();
  const result = await Swal.fire({
    ...base,
    title,
    text,
    icon: 'warning',
    iconColor: '#e11d48',
    showCancelButton: true,
    confirmButtonColor: '#e11d48',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true
  });

  return result.isConfirmed;
};

/**
 * General confirmation modal
 */
export const confirmAction = async ({
  title = 'Confirm Action',
  text = 'Are you sure you want to proceed?',
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  icon = 'question'
} = {}) => {
  const base = getBaseConfig();
  const result = await Swal.fire({
    ...base,
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true
  });

  return result.isConfirmed;
};

/**
 * Success popup
 */
export const showSuccess = (title, text = '', timer = 2200) => {
  const base = getBaseConfig();
  return Swal.fire({
    ...base,
    title,
    text,
    icon: 'success',
    iconColor: '#10b981',
    confirmButtonColor: '#10b981',
    confirmButtonText: 'Great!',
    timer,
    timerProgressBar: true
  });
};

/**
 * Error popup
 */
export const showError = (title, text = '') => {
  const base = getBaseConfig();
  return Swal.fire({
    ...base,
    title,
    text,
    icon: 'error',
    iconColor: '#ef4444',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Understood'
  });
};

/**
 * Warning popup
 */
export const showWarning = (title, text = '') => {
  const base = getBaseConfig();
  return Swal.fire({
    ...base,
    title,
    text,
    icon: 'warning',
    iconColor: '#f59e0b',
    confirmButtonColor: '#f59e0b',
    confirmButtonText: 'OK'
  });
};

/**
 * Top-end sleek toast notification
 */
export const showToast = (title, icon = 'success') => {
  const dark = isDarkMode();
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
    background: dark ? '#0f172a' : '#ffffff',
    color: dark ? '#f8fafc' : '#0f172a',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });

  return Toast.fire({
    icon,
    title
  });
};

export default Swal;
