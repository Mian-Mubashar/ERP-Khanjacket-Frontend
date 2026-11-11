import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ReceiptText,
  Plus,
  Printer,
  Download,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  Calendar,
  User,
  MapPin,
  Building2,
  FolderOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  ChevronDown,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  ListOrdered
} from 'lucide-react';
import Swal, { showToast, confirmDelete, showError } from '../../utils/sweetalert';
import { downloadUgrahiSheetPDF } from '../../utils/pdfGenerator';
import { formatCustomerDisplayName } from '../../utils/formatters';
import { Pagination } from '../common/Pagination';
import { UGRAHI_ROUTES } from '../../constants/ugrahiRoutes';
import logoImg from '../../images/khan jacket logo.png';

// Editable Serial Number Input for Row Reordering
const SrNoInput = ({ rowId, currentSrNo, totalRows, onMove }) => {
  const [val, setVal] = useState(String(currentSrNo));
  const isInputFocused = useRef(false);

  useEffect(() => {
    if (!isInputFocused.current) {
      setVal(String(currentSrNo));
    }
  }, [currentSrNo]);

  const handleCommit = (overrideVal) => {
    isInputFocused.current = false;
    const raw = overrideVal !== undefined ? overrideVal : val;
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num > 0 && num !== currentSrNo) {
      onMove(rowId, num);
    } else {
      setVal(String(currentSrNo));
    }
  };

  return (
    <input
      type="number"
      min="1"
      max={totalRows || 9999}
      value={val}
      onFocus={(e) => {
        isInputFocused.current = true;
        e.target.select();
      }}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => handleCommit()}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleCommit(e.currentTarget.value);
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          isInputFocused.current = false;
          setVal(String(currentSrNo));
          e.currentTarget.blur();
        }
      }}
      className="w-12 h-6.5 text-center font-mono font-bold text-xs bg-slate-50 hover:bg-white focus:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:focus:bg-slate-800 border border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600 focus:border-blue-500 rounded-md outline-hidden text-slate-700 dark:text-slate-200 transition-all cursor-text shadow-2xs focus:ring-2 focus:ring-blue-500/20"
      title={`Current: #${currentSrNo}. Type a new position number and press Enter to reorder.`}
    />
  );
};

export const UgrahiView = () => {
  const { customers = [], cities = [], areas = [], currentUser } = useApp();

  // Only customers explicitly marked for Ugrahi (Payment Collection)
  const ugrahiCustomers = useMemo(() => {
    return (customers || []).filter(c => c && (c.inUgrahi === true || c.inUgrahi === 1));
  }, [customers]);

  // Sheet Meta Information
  const [sheetTitle, setSheetTitle] = useState('All Cities Payment Collection Sheet');
  const [sheetDate, setSheetDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectorName, setCollectorName] = useState(currentUser?.name || 'Admin Khan');
  const [routeLocation, setRouteLocation] = useState('All Wholesale Markets');
  const [selectedCities, setSelectedCities] = useState(['ALL']);
  const selectedCity = selectedCities.includes('ALL') || selectedCities.length === 0
    ? 'ALL'
    : (selectedCities.length === 1 ? selectedCities[0] : selectedCities.join('+'));
  const setSelectedCity = (cityName) => {
    setSelectedCities(cityName ? [cityName] : ['ALL']);
  };
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('ALL');
  const [tableSearch, setTableSearch] = useState('');
  const [dueOnly, setDueOnly] = useState(false); // Toggle: Only show customers with balance > 0

  // Route Active Check Helper
  const isRouteActive = useCallback((routeName) => {
    if (!routeName) return false;
    if (selectedCities.includes('ALL')) return true;
    return selectedCities.some(c => c.toLowerCase() === routeName.toLowerCase());
  }, [selectedCities]);

  // Area Append & Route Ordering State
  const [isAppendAreaMenuOpen, setIsAppendAreaMenuOpen] = useState(false);
  const appendAreaMenuRef = useRef(null);
  const [isArrangeModalOpen, setIsArrangeModalOpen] = useState(false);
  const [modalAreaOrder, setModalAreaOrder] = useState([]);
  const [modalSelectedCities, setModalSelectedCities] = useState(['Lahore']);

  // Persistent Area Sequence Order Map (Permanently remembered per city across reloads, sheets, and resets)
  const [areaSequencesMap, setAreaSequencesMap] = useState(() => {
    try {
      const saved = localStorage.getItem('kc_area_route_sequences_map');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load area sequence map:', e);
    }
    return {};
  });

  // Save to localStorage whenever areaSequencesMap changes
  useEffect(() => {
    try {
      localStorage.setItem('kc_area_route_sequences_map', JSON.stringify(areaSequencesMap));
    } catch (e) {
      console.error('Failed to save area sequences map:', e);
    }
  }, [areaSequencesMap]);

  // Helper to get active saved sequence for city/routes
  const getActiveSequenceForCities = useCallback((citiesList = selectedCities) => {
    if (!citiesList || citiesList.length === 0 || citiesList.includes('ALL')) {
      const combined = [];
      UGRAHI_ROUTES.forEach(route => {
        const routeSeq = areaSequencesMap[route];
        if (Array.isArray(routeSeq)) {
          routeSeq.forEach(a => {
            combined.push({ name: a, cityName: route });
          });
        }
      });
      return combined;
    }

    if (citiesList.length === 1) {
      const city = citiesList[0];
      const seq = areaSequencesMap[city];
      if (Array.isArray(seq)) {
        return seq.map(a => ({ name: a, cityName: city }));
      }
    } else {
      const multiKey = citiesList.map(c => c.toLowerCase()).sort().join('+');
      if (areaSequencesMap[multiKey] && Array.isArray(areaSequencesMap[multiKey])) {
        return areaSequencesMap[multiKey].map(entry => {
          const parts = String(entry).split(':::');
          return { name: parts[0], cityName: parts[1] || '' };
        });
      }
      const combined = [];
      citiesList.forEach(city => {
        const routeSeq = areaSequencesMap[city];
        if (Array.isArray(routeSeq)) {
          routeSeq.forEach(a => {
            combined.push({ name: a, cityName: city });
          });
        }
      });
      return combined;
    }
    return [];
  }, [areaSequencesMap, selectedCities]);

  // Helper to get active saved sequence for city/route
  const getActiveSequence = useCallback((cityKey = selectedCity) => {
    if (!cityKey || cityKey === 'ALL') {
      return getActiveSequenceForCities(['ALL']);
    }
    return getActiveSequenceForCities([cityKey]);
  }, [getActiveSequenceForCities, selectedCity]);

  // Get isolated or combined area list for one, two, or all selected cities
  const getAreasListForCities = useCallback((targetCities) => {
    if (!targetCities || targetCities.length === 0) return [];

    const effectiveCities = targetCities.includes('ALL') ? UGRAHI_ROUTES : targetCities;
    const cityItems = [];
    const seen = new Set();

    effectiveCities.forEach(city => {
      const cityLower = city.trim().toLowerCase();

      const cityAreasSet = new Set();
      areas
        .filter(a => (a.cityName || '').trim().toLowerCase() === cityLower)
        .forEach(a => a.name && cityAreasSet.add(a.name.trim()));

      ugrahiCustomers
        .filter(c => (c.ugrahiRoute || c.city || '').trim().toLowerCase() === cityLower)
        .forEach(c => c.area && cityAreasSet.add(c.area.trim()));

      const allCityAreas = Array.from(cityAreasSet);
      const savedSeq = areaSequencesMap[city] || [];
      const orderedNames = [];
      const citySeen = new Set();

      savedSeq.forEach(areaName => {
        const trimmed = (areaName || '').trim();
        const match = allCityAreas.find(a => a.toLowerCase() === trimmed.toLowerCase());
        if (match && !citySeen.has(match.toLowerCase())) {
          citySeen.add(match.toLowerCase());
          orderedNames.push(match);
        }
      });

      allCityAreas.forEach(areaName => {
        if (!citySeen.has(areaName.toLowerCase())) {
          citySeen.add(areaName.toLowerCase());
          orderedNames.push(areaName);
        }
      });

      orderedNames.forEach(areaName => {
        const itemKey = `${areaName.toLowerCase()}:::${cityLower}`;
        if (!seen.has(itemKey)) {
          seen.add(itemKey);
          cityItems.push({ name: areaName, cityName: city });
        }
      });
    });

    const multiKey = effectiveCities.map(c => c.toLowerCase()).sort().join('+');
    const savedMultiSeq = areaSequencesMap[multiKey];
    if (Array.isArray(savedMultiSeq) && savedMultiSeq.length > 0) {
      const rankMap = new Map();
      savedMultiSeq.forEach((entry, idx) => {
        rankMap.set(String(entry).toLowerCase(), idx);
      });

      return [...cityItems].sort((a, b) => {
        const keyA = `${a.name.toLowerCase()}:::${a.cityName.toLowerCase()}`;
        const keyB = `${b.name.toLowerCase()}:::${b.cityName.toLowerCase()}`;
        const rA = rankMap.has(keyA) ? rankMap.get(keyA) : (rankMap.has(a.name.toLowerCase()) ? rankMap.get(a.name.toLowerCase()) : 999);
        const rB = rankMap.has(keyB) ? rankMap.get(keyB) : (rankMap.has(b.name.toLowerCase()) ? rankMap.get(b.name.toLowerCase()) : 999);
        return rA - rB;
      });
    }

    return cityItems;
  }, [areas, ugrahiCustomers, areaSequencesMap]);

  // Backward-compatible getAreasListForCity
  const getAreasListForCity = useCallback((targetCity) => {
    return getAreasListForCities([targetCity]);
  }, [getAreasListForCities]);

  // Sorter utility: Sorts rows strictly by the active area sequence order (supports { name, cityName } or string)
  const sortRowsByAreaSequence = useCallback((rowsList, sequenceOrder) => {
    if (!rowsList || rowsList.length === 0) return [];
    if (!sequenceOrder || sequenceOrder.length === 0) return rowsList;

    const rankMap = new Map();
    sequenceOrder.forEach((item, index) => {
      const areaName = typeof item === 'object' && item !== null ? item.name : item;
      const cityName = typeof item === 'object' && item !== null ? item.cityName : '';
      const normArea = (areaName || '').trim().toLowerCase();
      const normCity = (cityName || '').trim().toLowerCase();

      if (normCity) {
        rankMap.set(`${normArea}:::${normCity}`, index);
      }
      if (!rankMap.has(normArea)) {
        rankMap.set(normArea, index);
      }
    });

    const fallbackRank = sequenceOrder.length + 999;

    return [...rowsList].sort((a, b) => {
      const aArea = (a.area || '').trim().toLowerCase();
      const aCity = (a.ugrahiRoute || a.city || '').trim().toLowerCase();
      const bArea = (b.area || '').trim().toLowerCase();
      const bCity = (b.ugrahiRoute || b.city || '').trim().toLowerCase();

      const keyA = `${aArea}:::${aCity}`;
      const keyB = `${bArea}:::${bCity}`;

      const rankA = rankMap.has(keyA) ? rankMap.get(keyA) : (rankMap.has(aArea) ? rankMap.get(aArea) : fallbackRank);
      const rankB = rankMap.has(keyB) ? rankMap.get(keyB) : (rankMap.has(bArea) ? rankMap.get(bArea) : fallbackRank);

      if (rankA !== rankB) return rankA - rankB;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, []);

  // 20-Item Pagination State
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Export Dropdown State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef(null);

  // 3-Dots dropdown state for Saved Sheets items
  const [activeSavedMenuId, setActiveSavedMenuId] = useState(null);

  // Outside click listener for Export dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
      if (appendAreaMenuRef.current && !appendAreaMenuRef.current.contains(e.target)) {
        setIsAppendAreaMenuOpen(false);
      }
    };
    if (isExportOpen || isAppendAreaMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExportOpen, isAppendAreaMenuOpen]);

  // Outside click listener for Saved Sheets item 3-dots menu
  useEffect(() => {
    const handleCloseSavedMenu = () => setActiveSavedMenuId(null);
    if (activeSavedMenuId) {
      document.addEventListener('click', handleCloseSavedMenu);
    }
    return () => {
      document.removeEventListener('click', handleCloseSavedMenu);
    };
  }, [activeSavedMenuId]);

  // Helper to map DB customers to collection sheet rows
  const mapCustomersToRows = (custList, filterDueOnly = false) => {
    let list = custList || [];
    if (filterDueOnly) {
      list = list.filter(c => Number(c.remainingBalance || 0) > 0);
    }
    return list.map((c) => ({
      id: `cust-${c.id}`,
      customerId: c.id,
      name: formatCustomerDisplayName(c.shopName, c.shopkeeperName),
      address: c.marketAddress ? `${c.marketAddress}, ${c.city}` : c.city || '',
      city: c.ugrahiRoute || c.city || '',
      area: c.area || '',
      totalDue: Number(c.remainingBalance) || 0,
      wasool: ''
    }));
  };

  // Compute available areas for active route
  const availableAreasForRoute = useMemo(() => {
    let cityCustomers = ugrahiCustomers;
    if (!selectedCities.includes('ALL')) {
      cityCustomers = ugrahiCustomers.filter(c => isRouteActive(c.ugrahiRoute || c.city));
    }

    const areaSet = new Set();
    if (!selectedCities.includes('ALL')) {
      areas
        .filter(a => isRouteActive(a.cityName))
        .forEach(a => a.name && areaSet.add(a.name.trim()));
    } else {
      areas.forEach(a => a.name && areaSet.add(a.name.trim()));
    }

    cityCustomers.forEach(c => {
      if (c.area && c.area.trim()) {
        areaSet.add(c.area.trim());
      }
    });

    return Array.from(areaSet).sort((a, b) => a.localeCompare(b));
  }, [areas, ugrahiCustomers, selectedCities, isRouteActive]);

  // Compute shop count per area
  const areaCounts = useMemo(() => {
    let cityCustomers = ugrahiCustomers;
    if (!selectedCities.includes('ALL')) {
      cityCustomers = ugrahiCustomers.filter(c => isRouteActive(c.ugrahiRoute || c.city));
    }
    const counts = { ALL: cityCustomers.length };
    availableAreasForRoute.forEach(areaName => {
      counts[areaName] = cityCustomers.filter(
        c => (c.area || '').toLowerCase() === areaName.toLowerCase()
      ).length;
    });
    return counts;
  }, [ugrahiCustomers, selectedCities, isRouteActive, availableAreasForRoute]);

  // Sort areas for append dropdown: areas with customers first, then alphabetical
  const sortedAreasForAppend = useMemo(() => {
    return [...availableAreasForRoute].sort((a, b) => {
      const countA = areaCounts[a] || 0;
      const countB = areaCounts[b] || 0;
      if (countA !== countB) return countB - countA;
      return a.localeCompare(b);
    });
  }, [availableAreasForRoute, areaCounts]);

  // Compute shop count per Ugrahi route (Lahore, Raiwind, Sheikhupura, Multan, Sialkot)
  const routeCounts = useMemo(() => {
    const counts = { ALL: ugrahiCustomers.length };
    UGRAHI_ROUTES.forEach(r => {
      counts[r] = ugrahiCustomers.filter(c => (c.ugrahiRoute || c.city || '').toLowerCase() === r.toLowerCase()).length;
    });
    return counts;
  }, [ugrahiCustomers]);

  // Initial Rows Data with LocalStorage fallback
  const [rows, setRows] = useState(() => {
    const saved = localStorage.getItem('kc_active_collection_rows');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(r => ({
            ...r,
            name: formatCustomerDisplayName(r.name)
          }));
        }
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Live Synchronization & Auto-population Effect:
  // Keeps active collection rows 100% in sync with live MySQL customers state (balances, new payments, outward bills, additions, removals)
  useEffect(() => {
    if (!customers || customers.length === 0) return;

    setRows(prevRows => {
      const custMap = new Map(customers.map(c => [c.id, c]));
      const ugrahiIds = new Set(ugrahiCustomers.map(c => c.id));

      // Case A: Initial mount or empty rows -> populate from ugrahiCustomers for active route in saved area sequence
      if (!prevRows || prevRows.length === 0) {
        let source = ugrahiCustomers;
        if (!selectedCities.includes('ALL')) {
          source = ugrahiCustomers.filter(c => isRouteActive(c.ugrahiRoute || c.city));
        }
        const mapped = mapCustomersToRows(source, dueOnly);
        return sortRowsByAreaSequence(mapped, getActiveSequenceForCities(selectedCities));
      }

      let hasChanges = false;

      // Case B: Rows already exist (from localStorage or active state) -> sync live balances and customer info
      const updatedExisting = prevRows
        .filter(r => {
          // Manual custom rows (without customerId) are always preserved
          if (!r.customerId) return true;
          // If customer was removed from Payment Collection, remove from active sheet
          if (!ugrahiIds.has(r.customerId)) {
            hasChanges = true;
            return false;
          }
          // If specific city/route filter is active, verify route still matches
          if (!selectedCities.includes('ALL')) {
            const cust = custMap.get(r.customerId);
            const matchesRoute = cust && isRouteActive(cust.ugrahiRoute || cust.city);
            if (!matchesRoute) {
              hasChanges = true;
              return false;
            }
          }
          return true;
        })
        .map(r => {
          if (!r.customerId) return r;
          const cust = custMap.get(r.customerId);
          if (!cust) return r;

          const freshDue = Number(cust.remainingBalance) || 0;
          const freshName = formatCustomerDisplayName(cust.shopName, cust.shopkeeperName);
          const freshAddress = cust.marketAddress ? `${cust.marketAddress}, ${cust.city}` : cust.city || '';
          const freshCity = cust.ugrahiRoute || cust.city || '';
          const freshArea = cust.area || '';

          if (
            r.totalDue !== freshDue ||
            r.name !== freshName ||
            r.address !== freshAddress ||
            r.city !== freshCity ||
            r.area !== freshArea
          ) {
            hasChanges = true;
            return {
              ...r,
              totalDue: freshDue,
              name: freshName,
              address: freshAddress,
              city: freshCity,
              area: freshArea
            };
          }
          return r;
        });

      // Check if any customer marked in Payment Collection is missing from rows
      const existingCustIds = new Set(updatedExisting.filter(r => r.customerId).map(r => r.customerId));
      let missingCandidates = ugrahiCustomers.filter(c => !existingCustIds.has(c.id));
      if (!selectedCities.includes('ALL')) {
        missingCandidates = missingCandidates.filter(c => isRouteActive(c.ugrahiRoute || c.city));
      }
      if (dueOnly) {
        missingCandidates = missingCandidates.filter(c => Number(c.remainingBalance || 0) > 0);
      }

      if (missingCandidates.length > 0) {
        hasChanges = true;
        const newRows = mapCustomersToRows(missingCandidates, dueOnly);
        const combined = [...updatedExisting, ...newRows];
        return sortRowsByAreaSequence(combined, getActiveSequenceForCities(selectedCities));
      }

      return hasChanges ? updatedExisting : prevRows;
    });
  }, [customers, ugrahiCustomers, selectedCities, isRouteActive, dueOnly, getActiveSequenceForCities, sortRowsByAreaSequence]);

  // Saved Sheets Library
  const [savedSheets, setSavedSheets] = useState(() => {
    const saved = localStorage.getItem('kc_saved_collection_sheets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);

  // Persist active rows in localStorage
  useEffect(() => {
    localStorage.setItem('kc_active_collection_rows', JSON.stringify(rows));
  }, [rows]);

  // Persist saved sheets library in localStorage
  useEffect(() => {
    localStorage.setItem('kc_saved_collection_sheets', JSON.stringify(savedSheets));
  }, [savedSheets]);

  // Financial Summary Calculations
  const totalOutstanding = useMemo(() => {
    return rows.reduce((s, r) => s + (Number(r.totalDue) || 0), 0);
  }, [rows]);

  const totalCollected = useMemo(() => {
    return rows.reduce((s, r) => s + (Number(r.wasool) || 0), 0);
  }, [rows]);

  const remainingBalance = totalOutstanding - totalCollected;

  // Filtered rows for area filter and live in-table search
  const displayedRows = useMemo(() => {
    let list = rows;
    if (selectedAreaFilter && selectedAreaFilter !== 'ALL') {
      list = list.filter(r => (r.area || '').toLowerCase() === selectedAreaFilter.toLowerCase());
    }
    if (tableSearch && tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(r => {
        return (
          (r.name || '').toLowerCase().includes(q) ||
          (r.address || '').toLowerCase().includes(q) ||
          (r.city || '').toLowerCase().includes(q) ||
          (r.area || '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [rows, selectedAreaFilter, tableSearch]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [tableSearch, selectedCity, selectedAreaFilter, dueOnly]);

  // Sliced rows for 12-item page limit
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayedRows.slice(start, start + pageSize);
  }, [displayedRows, page, pageSize]);

  // Add a Blank Custom Row
  const handleAddRow = () => {
    const newRow = {
      id: `row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      address: '',
      city: selectedCity === 'ALL' ? '' : selectedCity,
      totalDue: '',
      wasool: ''
    };
    setRows(prev => [...prev, newRow]);
    const nextTotal = displayedRows.length + 1;
    setPage(Math.ceil(nextTotal / pageSize));
  };

  // Update specific field in row
  const handleRowChange = (id, field, value) => {
    setRows(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        return { ...r, [field]: value };
      })
    );
  };

  // Handle typing or choosing customer from datalist
  const handleCustomerNameChange = (rowId, val) => {
    const matched = customers.find(c => {
      const fullLabel = formatCustomerDisplayName(c.shopName, c.shopkeeperName);
      return (
        fullLabel.toLowerCase() === val.trim().toLowerCase() ||
        (c.shopName && c.shopName.toLowerCase() === val.trim().toLowerCase()) ||
        (c.shopkeeperName && c.shopkeeperName.toLowerCase() === val.trim().toLowerCase())
      );
    });

    if (matched) {
      setRows(prev =>
        prev.map(r => {
          if (r.id !== rowId) return r;
          return {
            ...r,
            name: formatCustomerDisplayName(matched.shopName, matched.shopkeeperName),
            address: matched.marketAddress ? `${matched.marketAddress}, ${matched.city}` : matched.city || '',
            city: matched.city || '',
            area: matched.area || '',
            totalDue: matched.remainingBalance || 0,
            customerId: matched.id
          };
        })
      );
    } else {
      handleRowChange(rowId, 'name', val);
    }
  };

  // Remove Row
  const handleRemoveRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // Reorder Row by User-Specified Serial Number
  const handleMoveRow = (rowId, targetPosition) => {
    const targetPos = parseInt(targetPosition, 10);
    if (isNaN(targetPos) || targetPos < 1) return;

    setRows(prevRows => {
      // If table search is active, reorder relative to displayed items
      if (tableSearch && tableSearch.trim()) {
        const fromDispIdx = displayedRows.findIndex(r => r.id === rowId);
        if (fromDispIdx === -1) return prevRows;

        const clampedTarget = Math.max(1, Math.min(displayedRows.length, targetPos));
        if (clampedTarget === fromDispIdx + 1) return prevRows;

        const targetRow = displayedRows[clampedTarget - 1];
        if (!targetRow || targetRow.id === rowId) return prevRows;

        const fromRealIdx = prevRows.findIndex(r => r.id === rowId);
        const toRealIdx = prevRows.findIndex(r => r.id === targetRow.id);
        if (fromRealIdx === -1 || toRealIdx === -1) return prevRows;

        const next = [...prevRows];
        const [moved] = next.splice(fromRealIdx, 1);
        next.splice(toRealIdx, 0, moved);
        showToast(`Row moved to #${clampedTarget}`, 'success');
        return next;
      }

      // Normal view
      const fromIndex = prevRows.findIndex(r => r.id === rowId);
      if (fromIndex === -1) return prevRows;

      const clampedTargetPos = Math.max(1, Math.min(prevRows.length, targetPos));
      const toIndex = clampedTargetPos - 1;

      if (fromIndex === toIndex) return prevRows;

      const next = [...prevRows];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);

      // Navigate to the target page if position is outside current page
      const targetPage = Math.floor(toIndex / pageSize) + 1;
      if (targetPage !== page) {
        setPage(targetPage);
      }

      showToast(`Row moved to #${clampedTargetPos}`, 'success');
      return next;
    });
  };

  // Route Filter Change Handler (Supports multi-select toggle)
  const handleCityToggle = (cityName) => {
    setSelectedAreaFilter('ALL');
    setTableSearch('');

    let nextCities;
    if (cityName === 'ALL') {
      nextCities = ['ALL'];
    } else if (selectedCities.includes('ALL')) {
      nextCities = [cityName];
    } else if (selectedCities.some(c => c.toLowerCase() === cityName.toLowerCase())) {
      if (selectedCities.length === 1) {
        nextCities = ['ALL'];
      } else {
        nextCities = selectedCities.filter(c => c.toLowerCase() !== cityName.toLowerCase());
      }
    } else {
      nextCities = [...selectedCities, cityName];
    }

    setSelectedCities(nextCities);

    const targetSeq = getActiveSequenceForCities(nextCities);

    let candidates = ugrahiCustomers;
    if (!nextCities.includes('ALL')) {
      candidates = ugrahiCustomers.filter(c => {
        const cCity = (c.ugrahiRoute || c.city || '').trim().toLowerCase();
        return nextCities.some(cty => cty.trim().toLowerCase() === cCity);
      });
    }
    if (dueOnly) {
      candidates = candidates.filter(c => Number(c.remainingBalance || 0) > 0);
    }

    const nextRows = mapCustomersToRows(candidates, dueOnly);
    const sorted = sortRowsByAreaSequence(nextRows, targetSeq);
    setRows(sorted);

    const titleCity = nextCities.includes('ALL') 
      ? 'All Routes' 
      : (nextCities.length === 1 ? nextCities[0] : 'Multi-Route');
    setSheetTitle(`${titleCity} Payment Collection Sheet`);
    setRouteLocation(nextCities.includes('ALL') ? 'All Wholesale Routes' : (nextCities.length === 1 ? `${nextCities[0]} Wholesale Route` : `${nextCities.length} Routes Collection`));
  };

  const handleCityChange = (cityName) => {
    handleCityToggle(cityName);
  };

  // Append Area Customers Sequentially Below Current Sheet
  const handleAppendArea = (areaName) => {
    setIsAppendAreaMenuOpen(false);

    let candidates = ugrahiCustomers.filter(
      c => (c.area || '').toLowerCase() === areaName.toLowerCase()
    );
    if (!selectedCities.includes('ALL')) {
      candidates = candidates.filter(c => isRouteActive(c.ugrahiRoute || c.city));
    }
    if (dueOnly) {
      candidates = candidates.filter(c => Number(c.remainingBalance || 0) > 0);
    }

    if (candidates.length === 0) {
      showToast(`No collection customers found in area "${areaName}"`, 'info');
      return;
    }

    setRows(prevRows => {
      const existingCustIds = new Set(prevRows.filter(r => r.customerId).map(r => r.customerId));
      const toAdd = candidates.filter(c => !existingCustIds.has(c.id));

      if (toAdd.length === 0) {
        // If all already exist in sheet, bring them sequentially to bottom
        const others = prevRows.filter(r => (r.area || '').toLowerCase() !== areaName.toLowerCase());
        const thisAreaRows = prevRows.filter(r => (r.area || '').toLowerCase() === areaName.toLowerCase());
        showToast(`Moved ${thisAreaRows.length} "${areaName}" shops to bottom of sheet`, 'success');
        return [...others, ...thisAreaRows];
      }

      const newRows = mapCustomersToRows(toAdd, dueOnly);
      showToast(`Appended ${newRows.length} shops from "${areaName}" below current list!`, 'success');
      return [...prevRows, ...newRows];
    });
  };

  // Open Route Order / Arrange Modal
  const handleOpenArrangeModal = (citiesOverride) => {
    let initialCities;
    if (Array.isArray(citiesOverride) && citiesOverride.length > 0) {
      initialCities = citiesOverride;
    } else if (typeof citiesOverride === 'string' && citiesOverride && citiesOverride !== 'ALL') {
      initialCities = [citiesOverride];
    } else if (selectedCities && selectedCities.length > 0 && !selectedCities.includes('ALL')) {
      initialCities = selectedCities;
    } else {
      initialCities = ['Lahore'];
    }

    setModalSelectedCities(initialCities);
    const cityAreas = getAreasListForCities(initialCities);
    setModalAreaOrder(cityAreas);
    setIsArrangeModalOpen(true);
  };

  // Toggle City in Modal Route Selector (Multi-Select Supported)
  const handleToggleModalCity = (cityName) => {
    if (cityName === 'ALL') {
      setModalSelectedCities(['ALL']);
      const allAreas = getAreasListForCities(['ALL']);
      setModalAreaOrder(allAreas);
      return;
    }

    setModalSelectedCities(prev => {
      let next;
      if (prev.includes('ALL')) {
        next = [cityName];
      } else if (prev.includes(cityName)) {
        if (prev.length === 1) {
          next = ['ALL'];
        } else {
          next = prev.filter(c => c !== cityName);
        }
      } else {
        next = [...prev, cityName];
      }

      const nextAreas = getAreasListForCities(next);
      setModalAreaOrder(nextAreas);
      return next;
    });
  };

  // Move Area to Top
  const handleMoveAreaToTop = (index) => {
    if (index <= 0) return;
    setModalAreaOrder(prev => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  // Move Area Up in Modal Sequence
  const handleMoveAreaUp = (index) => {
    if (index <= 0) return;
    setModalAreaOrder(prev => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Move Area Down in Modal Sequence
  const handleMoveAreaDown = (index) => {
    if (index >= modalAreaOrder.length - 1) return;
    setModalAreaOrder(prev => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  // Reset modal sequence to alphabetical order
  const handleResetModalOrderToAZ = () => {
    setModalAreaOrder(prev =>
      [...prev].sort((a, b) => {
        const nameA = typeof a === 'object' ? a.name : a;
        const nameB = typeof b === 'object' ? b.name : b;
        return nameA.localeCompare(nameB);
      })
    );
    showToast('Reset to alphabetical order (click Save to permanently save)', 'info');
  };

  // Apply Area Sequence Reordering to Rows & Save Permanently in LocalStorage
  const handleApplyAreaSequence = () => {
    const effectiveCities = modalSelectedCities.includes('ALL') ? UGRAHI_ROUTES : modalSelectedCities;

    // 1. Update sequence map for individual cities
    const updatedMap = { ...areaSequencesMap };
    effectiveCities.forEach(city => {
      const cityAreas = modalAreaOrder
        .filter(item => {
          const cName = typeof item === 'object' ? item.cityName : '';
          return !cName || cName.toLowerCase() === city.toLowerCase();
        })
        .map(item => (typeof item === 'object' ? item.name : item));
      if (cityAreas.length > 0) {
        updatedMap[city] = cityAreas;
      }
    });

    // 2. Save combined multi-city sequence if multiple cities
    const multiKey = effectiveCities.map(c => c.toLowerCase()).sort().join('+');
    updatedMap[multiKey] = modalAreaOrder.map(item => {
      const aName = typeof item === 'object' ? item.name : item;
      const cName = typeof item === 'object' ? item.cityName : '';
      return `${aName}:::${cName}`;
    });

    setAreaSequencesMap(updatedMap);
    try {
      localStorage.setItem('kc_area_route_sequences_map', JSON.stringify(updatedMap));
    } catch (e) {}

    // 3. Update main screen selectedCities to match modal
    setSelectedCities(modalSelectedCities);

    // 4. Filter & sort rows for active sheet
    let candidates = ugrahiCustomers;
    if (!modalSelectedCities.includes('ALL')) {
      candidates = ugrahiCustomers.filter(c => {
        const cCity = (c.ugrahiRoute || c.city || '').trim().toLowerCase();
        return modalSelectedCities.some(cty => cty.trim().toLowerCase() === cCity);
      });
    }
    if (dueOnly) {
      candidates = candidates.filter(c => Number(c.remainingBalance || 0) > 0);
    }

    const candidateRows = mapCustomersToRows(candidates, dueOnly);
    const sorted = sortRowsByAreaSequence(candidateRows, modalAreaOrder);
    setRows(sorted);
    try {
      localStorage.setItem('kc_active_collection_rows', JSON.stringify(sorted));
    } catch (e) {}

    // 5. Update Sheet Title
    const titleCity = modalSelectedCities.includes('ALL') 
      ? 'All Routes' 
      : (modalSelectedCities.length === 1 ? modalSelectedCities[0] : 'Multi-Route');
    setSheetTitle(`${titleCity} Payment Collection Sheet`);
    setRouteLocation(modalSelectedCities.includes('ALL') ? 'All Wholesale Routes' : (modalSelectedCities.length === 1 ? `${modalSelectedCities[0]} Wholesale Route` : `${modalSelectedCities.length} Routes Collection`));

    setIsArrangeModalOpen(false);
    showToast(`Permanent area route sequence for "${titleCity}" saved and applied!`, 'success');
  };

  // Toggle "Only Baqaya Due" filter
  const handleToggleDueOnly = () => {
    const nextDue = !dueOnly;
    setDueOnly(nextDue);

    let source = ugrahiCustomers;
    if (!selectedCities.includes('ALL')) {
      source = ugrahiCustomers.filter(c => isRouteActive(c.ugrahiRoute || c.city));
    }

    const updated = mapCustomersToRows(source, nextDue);
    const sorted = sortRowsByAreaSequence(updated, getActiveSequenceForCities(selectedCities));
    setRows(sorted);
  };

  // Reset / Load All Collection Customers Button
  const handleResetToAll = () => {
    if (ugrahiCustomers.length === 0) {
      showToast('No customers currently added to Payment Collection', 'info');
      setRows([]);
      return;
    }
    let source = ugrahiCustomers;
    if (!selectedCities.includes('ALL')) {
      source = ugrahiCustomers.filter(c => isRouteActive(c.ugrahiRoute || c.city));
    }
    const allRows = mapCustomersToRows(source, dueOnly);
    const sorted = sortRowsByAreaSequence(allRows, getActiveSequenceForCities(selectedCities));
    setRows(sorted);
    try {
      localStorage.setItem('kc_active_collection_rows', JSON.stringify(sorted));
    } catch (e) {}
    setSelectedAreaFilter('ALL');
    setTableSearch('');
    showToast(`Loaded ${sorted.length} collection accounts in saved area sequence!`, 'success');
  };

  // Start Fresh New Collection Sheet
  const handleNewSheet = async () => {
    const isDark = document.documentElement.classList.contains('dark');
    const result = await Swal.fire({
      title: 'Start New Collection Sheet?',
      text: 'This will start a fresh sheet with all collection accounts arranged in your saved area sequence (clearing collected wasooli entries).',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Start New Sheet',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a'
    });

    if (result.isConfirmed) {
      const targetCity = selectedCity || 'ALL';
      let source = ugrahiCustomers;
      if (targetCity !== 'ALL') {
        source = ugrahiCustomers.filter(
          c => (c.ugrahiRoute || c.city || '').toLowerCase() === targetCity.toLowerCase()
        );
      }
      const freshRows = mapCustomersToRows(source, dueOnly);
      const sorted = sortRowsByAreaSequence(freshRows, getActiveSequence(targetCity));
      setRows(sorted);
      try {
        localStorage.setItem('kc_active_collection_rows', JSON.stringify(sorted));
      } catch (e) {}

      const todayStr = new Date().toISOString().split('T')[0];
      setSheetDate(todayStr);
      setSheetTitle(`${targetCity === 'ALL' ? 'All Routes' : targetCity} Payment Collection Sheet`);
      setRouteLocation(targetCity === 'ALL' ? 'All Wholesale Routes' : `${targetCity} Wholesale Route`);
      setTableSearch('');
      setSelectedAreaFilter('ALL');
      showToast(`Fresh collection sheet started with ${sorted.length} accounts in saved area sequence!`, 'success');
    }
  };

  // Save Current Sheet to History Library with Name Prompt
  const handleSaveSheet = async () => {
    if (rows.length === 0) {
      showError('Cannot Save', 'Sheet has 0 customers. Please add or load customers first.');
      return;
    }

    const isDark = document.documentElement.classList.contains('dark');
    const defaultName = `${sheetTitle} (${sheetDate})`;

    const { value: customName, isConfirmed } = await Swal.fire({
      title: 'Save Collection Sheet',
      text: 'Enter a name for this collection sheet to store it in your saved history:',
      input: 'text',
      inputValue: defaultName,
      inputPlaceholder: 'e.g. Lahore Sunday Recovery List',
      showCancelButton: true,
      confirmButtonText: 'Save Sheet',
      cancelButtonText: 'Cancel',
      background: isDark ? '#0f172a' : '#ffffff',
      color: isDark ? '#f8fafc' : '#0f172a',
      inputValidator: (val) => {
        if (!val || !val.trim()) return 'Sheet name cannot be empty!';
      }
    });

    if (!isConfirmed || !customName) return;

    const newSaved = {
      id: `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: customName.trim(),
      date: sheetDate,
      collector: collectorName,
      route: routeLocation,
      city: selectedCity,
      rows: JSON.parse(JSON.stringify(rows)),
      totalOutstanding,
      totalCollected,
      savedAt: new Date().toISOString()
    };

    setSavedSheets(prev => [newSaved, ...prev.filter(s => s.title !== newSaved.title)]);
    showToast(`Sheet "${customName.trim()}" saved to library!`, 'success');
  };

  // Load a Saved Sheet into Active Table
  const handleLoadSaved = (sheet) => {
    setSheetTitle(sheet.title || 'Collection Sheet');
    setSheetDate(sheet.date || new Date().toISOString().split('T')[0]);
    setCollectorName(sheet.collector || 'Admin Khan');
    setRouteLocation(sheet.route || 'Wholesale Market');
    setSelectedCity(sheet.city || 'ALL');
    setRows(sheet.rows || []);
    setIsSavedDrawerOpen(false);
    showToast(`Loaded "${sheet.title}" (${sheet.rows?.length || 0} shops)!`, 'success');
  };

  // Print a specific saved sheet directly
  const handlePrintSaved = (sheet) => {
    handleLoadSaved(sheet);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Delete a Saved Sheet from Library
  const handleDeleteSaved = async (sheetId) => {
    const ok = await confirmDelete({
      title: 'Delete Saved Sheet?',
      text: 'Are you sure you want to delete this sheet from your saved library?',
      confirmButtonText: 'Yes, Delete'
    });
    if (ok) {
      setSavedSheets(prev => prev.filter(s => s.id !== sheetId));
      showToast('Saved sheet deleted from library', 'info');
    }
  };

  // Print Active Sheet (Clean A4 pad print)
  const handlePrint = () => {
    window.print();
  };

  // Download PDF of Active Sheet
  const handleDownloadPDF = () => {
    downloadUgrahiSheetPDF({
      sheetTitle,
      sheetDate,
      recoveryAgent: collectorName,
      targetRoute: routeLocation,
      rows: displayedRows.length > 0 ? displayedRows : rows
    });
    showToast('Collection PDF downloaded successfully!', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="hidden print:block font-sans text-black p-6 bg-white">
        <div className="border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3.5">
              <img src={logoImg} alt="Khan Jacket House" className="h-12 w-auto object-contain" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                  KHAN JACKET HOUSE
                </h1>
                <p className="text-xs text-slate-600">
                  Wholesale Distribution & Central Warehouse Management
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-base font-bold block">{sheetTitle}</span>
              <span className="text-xs text-slate-600 block">Date: {sheetDate}</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs mt-3 pt-2 border-t border-slate-300">
            <span><strong>Collector / Staff:</strong> {collectorName}</span>
            <span><strong>Location / Route:</strong> {routeLocation}</span>
            <span><strong>Total Accounts:</strong> {rows.length} Shops</span>
          </div>
        </div>

        <table className="w-full border-collapse border border-slate-800 text-left text-xs">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-800">
              <th className="border border-slate-800 p-2 text-center w-10">#</th>
              <th className="border border-slate-800 p-2 text-right w-40">Total Balance</th>
              <th className="border border-slate-800 p-2 text-right w-40">Amount Received</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id || idx} className="border-b border-slate-300">
                <td className="border border-slate-800 p-2 text-center font-bold">{idx + 1}</td>
                <td className="border border-slate-800 p-2 font-semibold">{row.name || '—'}</td>
                <td className="border border-slate-800 p-2 text-right font-mono font-bold">
                  {row.totalDue ? `Rs. ${Number(row.totalDue).toLocaleString()}` : '—'}
                </td>
                <td className="border border-slate-800 p-2 text-right font-mono font-bold">
                  {row.wasool ? `Rs. ${Number(row.wasool).toLocaleString()}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-sm">
              <td colSpan="2" className="border border-slate-800 p-2 text-right font-bold">
                Grand Total ({rows.length} Accounts):
              </td>
              <td className="border border-slate-800 p-2 text-right font-mono font-bold">
                Rs. {totalOutstanding.toLocaleString()}
              </td>
              <td className="border border-slate-800 p-2 text-right font-mono font-bold">
                Rs. {totalCollected.toLocaleString()}
              </td>
              <td className="border border-slate-800 p-2 text-center text-xs">
                Balance: Rs. {remainingBalance.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Signature Box */}
        <div className="flex justify-between items-end mt-16 pt-8 text-xs font-bold border-t border-slate-400">
          <div className="text-center w-48 border-t border-slate-800 pt-1">
            Collection Officer Signature
          </div>
          <div className="text-center w-48 border-t border-slate-800 pt-1">
            Verified By (Accounts / Munshi)
          </div>
          <div className="text-center w-48 border-t border-slate-800 pt-1">
            Authorized Signature (CEO)
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SCREEN VIEW (Executive Interactive App View)              */}
      {/* ========================================================= */}
      <div className="print:hidden space-y-4">
        
        {/* Top Action Bar: Merged into 2 Primary Clean Groups */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          {/* Left Group: Title & New Sheet */}
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Payment Collection Sheets
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {rows.length} Accounts
                </span>
              </div>
            </div>
          </div>

          {/* Right Group: Left = New Sheet + Reset | Right = Saved, Export, Save */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* + New Sheet */}
            <button
              type="button"
              onClick={handleNewSheet}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Start a fresh blank collection sheet"
            >
              <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>+ New Sheet</span>
            </button>

            {/* Reset / Load All */}
            <button
              type="button"
              onClick={handleResetToAll}
              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
              title="Reset & Load All Customers from Database"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* Saved Sheets Library */}
            <button
              type="button"
              onClick={() => setIsSavedDrawerOpen(true)}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="View saved collection sheets"
            >
              <FolderOpen className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Saved ({savedSheets.length})</span>
            </button>

            {/* Export Dropdown (Print / Download PDF) */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                type="button"
                onClick={() => setIsExportOpen(prev => !prev)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Export options: Print or Download PDF"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportOpen(false);
                      handlePrint();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Printer className="w-4 h-4 text-slate-400" />
                    <span>Print Sheet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportOpen(false);
                      handleDownloadPDF();
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                    <span>Download PDF</span>
                  </button>
                </div>
              )}
            </div>

            {/* Primary Accent Save Button */}
            <button
              type="button"
              onClick={handleSaveSheet}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Save current sheet to library"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Sheet</span>
            </button>

          </div>
        </div>

        {/* 4 Clean Standard KPI Cards (Title -> Bold Value, subtle tooltip) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Total Customers */}
          <div 
            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
            title="Total shops listed in active collection sheet"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px]">Total Customers</span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white tracking-tight truncate">
              {rows.length} <span className="text-xs font-normal text-slate-400 font-sans">Shops</span>
            </div>
          </div>

          {/* 2. Total Outstanding */}
          <div 
            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
            title="Total outstanding khata balance due across listed shops"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-rose-500">Total Outstanding</span>
              <div className="w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <ReceiptText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tracking-tight truncate">
              Rs. {Math.round(totalOutstanding).toLocaleString()}
            </div>
          </div>

          {/* 3. Total Collected */}
          <div 
            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
            title="Total wasooli / cash payments received during collection"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-500">Total Collected</span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
              Rs. {Math.round(totalCollected).toLocaleString()}
            </div>
          </div>

          {/* 4. Remaining Balance */}
          <div 
            className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
            title="Net remaining field balance pending after collected wasooli"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[11px] text-blue-500">Remaining Balance</span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-blue-600 dark:text-blue-400 tracking-tight truncate">
              Rs. {Math.round(remainingBalance).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Streamlined Single Horizontal Filter & Config Bar */}
        <div className="relative z-30 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-3.5 shadow-2xs space-y-2.5">
          {/* Single Row: Title, Date, Collector, City Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Sheet Title */}
            <div>
              <input
                type="text"
                value={sheetTitle}
                onChange={e => setSheetTitle(e.target.value)}
                placeholder="Sheet Title / Route..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-colors"
                title="Sheet Title"
              />
            </div>

            {/* Date */}
            <div>
              <input
                type="date"
                value={sheetDate}
                onChange={e => setSheetDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-colors"
                title="Collection Date"
              />
            </div>

            {/* Collector */}
            <div>
              <input
                type="text"
                value={collectorName}
                onChange={e => setCollectorName(e.target.value)}
                placeholder="Collector / Officer Name..."
                className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500 transition-colors"
                title="Collector Name"
              />
            </div>

            {/* Ugrahi Route Dropdown Filter */}
            <div>
              <select
                value={selectedCities.includes('ALL') ? 'ALL' : (selectedCities.length === 1 ? selectedCities[0] : 'MULTI')}
                onChange={e => {
                  if (e.target.value === 'ALL') {
                    handleCityToggle('ALL');
                  } else {
                    handleCityChange(e.target.value);
                  }
                }}
                className="w-full px-3 py-1.5 bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold text-blue-800 dark:text-blue-300 outline-hidden focus:border-blue-500 transition-colors cursor-pointer"
                title="Filter by Ugrahi Route"
              >
                <option value="ALL">All Cities ({routeCounts.ALL})</option>
                {UGRAHI_ROUTES.map(route => (
                  <option key={route} value={route}>
                    {route} ({routeCounts[route] || 0})
                  </option>
                ))}
                {!selectedCities.includes('ALL') && selectedCities.length > 1 && (
                  <option value="MULTI" disabled>
                    ✓ Multiple Routes ({selectedCities.length} Selected)
                  </option>
                )}
              </select>
            </div>
          </div>

          {/* Dedicated Collection Routes Chips Bar */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-blue-500" />
              <span>Route Filter:</span>
            </span>

            {/* All Routes Chip */}
            <button
              type="button"
              onClick={() => handleCityToggle('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCities.includes('ALL')
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              All Routes ({routeCounts.ALL})
            </button>

            {/* Dedicated Routes: Lahore, Androon Lahore, Raiwind, Sheikhupura, Multan, Sialkot */}
            {UGRAHI_ROUTES.map(route => {
              const count = routeCounts[route] || 0;
              const isSelected = !selectedCities.includes('ALL') && selectedCities.some(c => c.toLowerCase() === route.toLowerCase());
              return (
                <button
                  key={route}
                  type="button"
                  onClick={() => handleCityToggle(route)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400/40'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                  }`}
                  title={`Click to filter ${route}. Click another route to view multiple together.`}
                >
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  <span>{route}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-white/25 text-white font-bold' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

            {/* Only Baqaya Due Toggle */}
            <button
              type="button"
              onClick={handleToggleDueOnly}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                dueOnly
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Only Balance Due</span>
              {dueOnly && <span className="text-[9px] bg-white/25 px-1 rounded font-bold">Active</span>}
            </button>
          </div>

          {/* Dedicated Areas Sub-bar: Clean Header + Prominent Actions, and Scrollable/Clean Chips */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            {/* Header with Title on Left and Actions on Right */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Area Route Planning:</span>
                </span>
              </div>

              {/* Action Buttons: + Append Area Dropdown & Route Order by Area Button */}
              <div className="flex items-center gap-2 relative">
                {/* + Append Area to Sheet Dropdown */}
                <div className="relative" ref={appendAreaMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAppendAreaMenuOpen(prev => !prev)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Add shops of a specific area sequentially below existing list"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Append Area</span>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-200" />
                  </button>

                  {isAppendAreaMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-72 overflow-y-auto">
                      <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/70">
                        <span>Pick Area to Append Below</span>
                        <span className="text-[10px] font-mono text-slate-400">{sortedAreasForAppend.length} Areas</span>
                      </div>
                      {sortedAreasForAppend.length === 0 ? (
                        <div className="px-3.5 py-4 text-xs text-slate-400 italic text-center">No areas available</div>
                      ) : (
                        sortedAreasForAppend.map(areaName => {
                          const count = areaCounts[areaName] || 0;
                          return (
                            <button
                              key={areaName}
                              type="button"
                              onClick={() => handleAppendArea(areaName)}
                              className="w-full text-left px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-50 dark:border-slate-800/30 last:border-b-0"
                            >
                              <span className="font-semibold flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                                <span className="truncate">{areaName}</span>
                              </span>
                              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full shrink-0 ${
                                count > 0 
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                              }`}>
                                {count} {count === 1 ? 'shop' : 'shops'}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Arrange / Route Order by Areas Button */}
                <button
                  type="button"
                  onClick={() => handleOpenArrangeModal(selectedCities)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Organize / Reorder all shops in sheet by Area sequence"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Route Order ({selectedCities.includes('ALL') ? 'All Routes' : (selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} Routes`)})
                  </span>
                </button>
              </div>
            </div>

            {/* Area Filter Chips Strip (Contained to max 2 lines with smooth clean scroller) */}
            <div className="flex items-start gap-2 pt-1">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider py-0.5 shrink-0 flex items-center gap-1">
                <span>View Filter:</span>
              </span>

              <div className="flex-1 max-h-[62px] overflow-y-auto pr-1 flex flex-wrap items-center gap-1.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] dark:[scrollbar-color:#334155_transparent]">
                {/* All Areas Chip */}
                <button
                  type="button"
                  onClick={() => setSelectedAreaFilter('ALL')}
                  className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    selectedAreaFilter === 'ALL' || !selectedAreaFilter
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  All Areas ({areaCounts.ALL})
                </button>

                {/* Individual Area Chips */}
                {availableAreasForRoute.map(areaName => {
                  const count = areaCounts[areaName] || 0;
                  const isSelected = selectedAreaFilter.toLowerCase() === areaName.toLowerCase();
                  return (
                    <button
                      key={areaName}
                      type="button"
                      onClick={() => setSelectedAreaFilter(isSelected ? 'ALL' : areaName)}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : count > 0
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/60 dark:border-blue-900/40'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>📍 {areaName}</span>
                      {count > 0 && <span className="font-bold">({count})</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Collection Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
          
          {/* Table Header Action Bar */}
          <div className="px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                placeholder="Search customer, location or city in sheet..."
                className="w-full pl-8.5 pr-8 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:border-blue-500"
              />
              {tableSearch && (
                <button
                  type="button"
                  onClick={() => setTableSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium mr-1">
                Showing {displayedRows.length === 0 ? 0 : `${(page - 1) * pageSize + 1} - ${Math.min(displayedRows.length, page * pageSize)}`} of {displayedRows.length} accounts
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Row</span>
              </button>
            </div>
          </div>

          {/* Datalist for fast customer autocomplete on custom row */}
          <datalist id="db-customer-list">
            {customers.map(c => (
              <option 
                key={c.id} 
                value={formatCustomerDisplayName(c.shopName, c.shopkeeperName)}
              />
            ))}
          </datalist>

          {/* Table with Compact Rows & Alignment */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-2 text-center w-14" title="Serial Number (Type new number & press Enter to reorder)">#</th>
                  <th className="py-2.5 px-3 min-w-[240px]">Customer / Shop Name</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Location / Address</th>
                  <th className="py-2.5 px-3 min-w-[150px] text-right">Total Balance (PKR)</th>
                  <th className="py-2.5 px-3 min-w-[150px] text-right">Collected Wasooli (PKR)</th>
                  <th className="py-2.5 px-2 text-center w-12 text-[10px] text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">
                      <div className="max-w-md mx-auto space-y-2.5 py-2 text-center">
                        <ReceiptText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          {tableSearch ? `No customers matching "${tableSearch}"` : 'No customers in sheet'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {ugrahiCustomers.length === 0
                            ? 'No customers added to Payment Collection yet. In Customers page, mark shops with "Include in Payment Collection" and select a route.'
                            : 'Click below to load Payment Collection customers or add a custom row.'}
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-1.5">
                          <button
                            type="button"
                            onClick={handleResetToAll}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Load Collection Customers ({ugrahiCustomers.length})</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAddRow}
                            className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Row</span>
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => {
                    const srNo = (page - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={row.id || idx}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Sr. No (Editable Reorder Input) */}
                        <td className="py-1.5 px-2 text-center">
                          <SrNoInput
                            rowId={row.id}
                            currentSrNo={srNo}
                            totalRows={displayedRows.length}
                            onMove={handleMoveRow}
                          />
                        </td>

                      {/* Customer Name (Single Clean Input, Zero Duplicate Sub-Text) */}
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          list="db-customer-list"
                          value={row.name}
                          onChange={e => handleCustomerNameChange(row.id, e.target.value)}
                          placeholder="Shop / Customer Name..."
                          className="w-full px-2.5 py-1 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-hidden transition-all"
                        />
                      </td>

                      {/* Location / Address */}
                      <td className="py-1.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {row.area && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/50">
                              <MapPin className="w-2.5 h-2.5" />
                              <span>{row.area}</span>
                            </span>
                          )}
                          <input
                            type="text"
                            value={row.address}
                            onChange={e => handleRowChange(row.id, 'address', e.target.value)}
                            placeholder="e.g. Anarkali, Thokar, Raja Bazaar"
                            className="w-full px-2.5 py-1 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-hidden transition-all"
                          />
                        </div>
                      </td>

                      {/* Total Balance (Right Aligned Number) */}
                      <td className="py-1.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.totalDue}
                          onChange={e => handleRowChange(row.id, 'totalDue', e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs font-mono font-bold text-right text-rose-600 dark:text-rose-400 outline-hidden transition-all"
                        />
                      </td>

                      {/* Collected Amount (Right Aligned Number, Simplified Placeholder) */}
                      <td className="py-1.5 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={row.wasool}
                          onChange={e => handleRowChange(row.id, 'wasool', e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-1 bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-lg text-xs font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 outline-hidden transition-all"
                        />
                      </td>

                      {/* Delete Row Button */}
                      <td className="py-1.5 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-950/50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Delete row from sheet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/70 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-xs">
                    <td colSpan="3" className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-300">
                      Total Summary:
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-600 dark:text-rose-400 font-bold">
                      Rs. {Math.round(totalOutstanding).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                      Rs. {Math.round(totalCollected).toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* 15-Item Pagination Component */}
          <Pagination
            currentPage={page}
            totalItems={displayedRows.length}
            pageSize={pageSize}
            onPageChange={setPage}
            itemLabel="accounts"
          />

          {/* Table Bottom Help Footer */}
          <div className="px-3.5 py-2.5 bg-slate-50/70 dark:bg-slate-800/30 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Print this sheet for your field recovery agent, or click Export &gt; Download PDF for records.
            </span>

            <button
              type="button"
              onClick={handleAddRow}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Customer</span>
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* SAVED SHEETS MODAL (History Library)                       */}
      {/* ========================================================= */}
      {isSavedDrawerOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-purple-600" />
                  <span>Saved Collection Sheets Library</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Open past sheets, download their PDF, or reprint anytime
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSavedDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 sm:p-4 overflow-y-auto space-y-2 flex-1">
              {savedSheets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <ReceiptText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No saved sheets yet</p>
                  <p className="mt-1">Click "Save Sheet" on any active collection sheet to store it here.</p>
                </div>
              ) : (
                savedSheets.map(s => (
                  <div
                    key={s.id}
                    className="p-2.5 sm:p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      {/* Clean Title */}
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {s.title}
                      </h4>

                      {/* Secondary Info: Date, Collector, Shops Badge, Baqaya Soft Red Highlight */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span>{s.date}</span>
                        <span>•</span>
                        <span>{s.collector || 'N/A'}</span>
                        <span>•</span>

                        {/* Clean Shops Badge */}
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                          {s.rows?.length || 0} Shops
                        </span>

                        {/* Soft Red Baqaya Highlight */}
                        <span className="text-[11px] px-2 py-0.5 rounded-md font-mono font-bold bg-rose-50 text-rose-600 border border-rose-200/70 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/60">
                          Baqaya: Rs. {(s.totalOutstanding || 0).toLocaleString()}
                        </span>

                        {Number(s.totalCollected) > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md font-mono font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/70 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60">
                            Wasool: Rs. {Number(s.totalCollected).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Single Primary Action [Open Sheet] + 3-Dots Dropdown */}
                    <div className="flex items-center gap-1.5 shrink-0 relative">
                      <button
                        type="button"
                        onClick={() => handleLoadSaved(s)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                        title="Open and edit this sheet in active table"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Open Sheet</span>
                      </button>

                      {/* 3-Dots Dropdown Trigger */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSavedMenuId(activeSavedMenuId === s.id ? null : s.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          activeSavedMenuId === s.id
                            ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title="More options (PDF, Print, Delete)"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>

                      {/* 3-Dots Dropdown Menu */}
                      {activeSavedMenuId === s.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-38 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100 dark:divide-slate-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSavedMenuId(null);
                              downloadUgrahiSheetPDF({
                                sheetTitle: s.title,
                                sheetDate: s.date,
                                recoveryAgent: s.collector,
                                targetRoute: s.route,
                                rows: s.rows
                              });
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-400" />
                            <span>Download PDF</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSavedMenuId(null);
                              handlePrintSaved(s);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-400" />
                            <span>Print Sheet</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveSavedMenuId(null);
                              handleDeleteSaved(s.id);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Sheet</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSavedDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ARRANGE AREA ROUTE SEQUENCE MODAL                         */}
      {/* ========================================================= */}
      {isArrangeModalOpen && (
        <div className="fixed inset-0 z-[80] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>
                        Route Sequence by Area {modalSelectedCities.includes('ALL') ? '(All Routes)' : (modalSelectedCities.length === 1 ? `(${modalSelectedCities[0]})` : `(${modalSelectedCities.length} Routes)`)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Auto-Saved Permanent
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Select 1 or multiple cities below. Arrange their areas in order. Sheet will display accounts in this exact sequence.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsArrangeModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Route Selection Multi-Toggle Tabs */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>Choose Cities in Route (Multi-Select):</span>
                </span>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                  {modalSelectedCities.includes('ALL')
                    ? 'All Routes Selected'
                    : `${modalSelectedCities.length} ${modalSelectedCities.length === 1 ? 'City' : 'Cities'} Active`}
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {/* All Routes Pill */}
                <button
                  type="button"
                  onClick={() => handleToggleModalCity('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    modalSelectedCities.includes('ALL')
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>All Routes</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    modalSelectedCities.includes('ALL') ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {areas.length}
                  </span>
                </button>

                {/* Individual Cities */}
                {UGRAHI_ROUTES.map(route => {
                  const isSel = !modalSelectedCities.includes('ALL') && modalSelectedCities.some(c => c.toLowerCase() === route.toLowerCase());
                  const routeAreaCount = areas.filter(a => (a.cityName || '').trim().toLowerCase() === route.toLowerCase()).length;
                  return (
                    <button
                      key={route}
                      type="button"
                      onClick={() => handleToggleModalCity(route)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        isSel
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                      title={`Click to add/remove ${route}`}
                    >
                      {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      <span>{route}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSel ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {routeAreaCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Area Sequence List Controls */}
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-slate-50/50 dark:bg-slate-800/30">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Recovery Sequence Order</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                  {modalAreaOrder.length} Areas
                </span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetModalOrderToAZ}
                  className="font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset A-Z</span>
                </button>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400 text-[11px]">Use arrows to reorder</span>
              </div>
            </div>

            {/* Area Cards List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {modalAreaOrder.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    No areas found for selected route(s)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Please select at least one route above.
                  </p>
                </div>
              ) : (
                modalAreaOrder.map((item, idx) => {
                  const areaName = typeof item === 'object' && item !== null ? item.name : item;
                  const cityName = typeof item === 'object' && item !== null ? item.cityName : '';
                  const count = rows.filter(r => {
                    const matchesArea = (r.area || '').toLowerCase() === (areaName || '').toLowerCase();
                    if (!cityName) return matchesArea;
                    const rCity = (r.ugrahiRoute || r.city || '').toLowerCase();
                    return matchesArea && rCity === cityName.toLowerCase();
                  }).length;

                  // Distinct city badge colors
                  const cityColorClasses = {
                    'lahore': 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
                    'multan': 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
                    'sheikhupura': 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
                    'raiwind': 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
                    'androon lahore': 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
                    'sialkot': 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                  }[(cityName || '').toLowerCase()] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <div
                      key={`${areaName}:::${cityName}:::${idx}`}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-3 transition-all hover:border-amber-400 dark:hover:border-amber-600 shadow-2xs"
                    >
                      {/* Left: Rank & Area info */}
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-amber-500/20">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              📍 {areaName}
                            </span>
                            {cityName && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${cityColorClasses}`}>
                                {cityName}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                            {count} {count === 1 ? 'shop' : 'shops'} in active collection sheet
                          </span>
                        </div>
                      </div>

                      {/* Right: Up / Down move controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Move to Top */}
                        <button
                          type="button"
                          onClick={() => handleMoveAreaToTop(idx)}
                          disabled={idx === 0}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                            idx === 0
                              ? 'opacity-20 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                          }`}
                          title="Move to Top (#1)"
                        >
                          Top
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => handleMoveAreaUp(idx)}
                          disabled={idx === 0}
                          className={`p-1.5 rounded-lg border transition-all ${
                            idx === 0
                              ? 'opacity-20 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                          }`}
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => handleMoveAreaDown(idx)}
                          disabled={idx === modalAreaOrder.length - 1}
                          className={`p-1.5 rounded-lg border transition-all ${
                            idx === modalAreaOrder.length - 1
                              ? 'opacity-20 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer'
                          }`}
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                Top area (#1) will appear first in the collection sheet.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsArrangeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyAreaSequence}
                  disabled={modalAreaOrder.length === 0}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Save & Apply Sequence ({modalAreaOrder.length} Areas)
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
