
import React, { useState, useEffect } from 'react';
import { getAllWorkOrders, getWorkflows } from '../workflowStore';
import { CartableItem } from '../types';
import { Search, Filter, Wrench, Eye, X, Plus, Download, ChevronLeft, ChevronRight, CheckSquare, Square, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import { WorkOrders } from './WorkOrders';
import { useNavigate } from 'react-router-dom';

export const WorkOrderList: React.FC = () => {
  const navigate = useNavigate();
  
  // Data States
  const [items, setItems] = useState<CartableItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CartableItem[]>([]);
  const [paginatedItems, setPaginatedItems] = useState<CartableItem[]>([]);
  
  // UI States
  const [selectedItem, setSelectedItem] = useState<CartableItem | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Load Data
    const allItems = getAllWorkOrders();
    // Sort by date descending
    setItems(allItems.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }, []);

  // Filter Logic
  useEffect(() => {
    let res = items;

    // 1. Search Term
    if (searchTerm) {
      res = res.filter(item => 
        item.title.includes(searchTerm) || 
        item.trackingCode.includes(searchTerm) ||
        (item.data?.equipName && item.data.equipName.includes(searchTerm))
      );
    }

    // 2. Status Filter
    if (statusFilter !== 'ALL') {
        res = res.filter(item => {
             const status = getStatusLabel(item);
             return status.includes(statusFilter); // Simple check based on label text
        });
    }

    // 3. Date Range (Simple string comparison for Shamsi date works generally if formatted correctly)
    if (dateFrom) {
        res = res.filter(item => item.createdAt >= dateFrom);
    }
    if (dateTo) {
        res = res.filter(item => item.createdAt <= dateTo);
    }

    setFilteredItems(res);
    setCurrentPage(1); // Reset to page 1 on filter change
    setSelectedIds([]); // Reset selection on filter change
  }, [items, searchTerm, statusFilter, dateFrom, dateTo]);

  // Pagination Logic
  useEffect(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    setPaginatedItems(filteredItems.slice(start, end));
  }, [filteredItems, currentPage, rowsPerPage]);

  const getStatusLabel = (item: CartableItem) => {
    if (item.status === 'DONE') return 'پایان یافته';
    const workflows = getWorkflows();
    const wf = workflows.find(w => w.id === item.workflowId);
    const step = wf?.steps.find(s => s.id === item.currentStepId);
    return step?.title || 'نامشخص';
  };

  const getStatusBadge = (item: CartableItem) => {
    const label = getStatusLabel(item);
    let colorClass = 'bg-gray-100 text-gray-600';
    
    if (label.includes('درخواست')) colorClass = 'bg-blue-100 text-blue-700';
    else if (label.includes('انجام')) colorClass = 'bg-orange-100 text-orange-700';
    else if (label.includes('تایید')) colorClass = 'bg-purple-100 text-purple-700';
    else if (label.includes('اتمام') || item.status === 'DONE') colorClass = 'bg-green-100 text-green-700';

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
            {label}
        </span>
    );
  };

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(paginatedItems.map(i => i.id));
      } else {
          setSelectedIds([]);
      }
  };

  const handleSelectOne = (id: string) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(sid => sid !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  // Export Handler (Mock CSV)
  const handleExport = () => {
      const dataToExport = selectedIds.length > 0 
        ? items.filter(i => selectedIds.includes(i.id))
        : filteredItems;
        
      if (dataToExport.length === 0) {
          alert('داده‌ای برای گزارش وجود ندارد.');
          return;
      }

      // Create CSV Content
      const header = ["کد پیگیری", "تجهیز", "عنوان", "درخواست کننده", "تاریخ", "وضعیت"];
      const rows = dataToExport.map(item => [
          item.trackingCode,
          item.data?.equipName || '-',
          item.title,
          item.data?.requester || '-',
          item.createdAt,
          getStatusLabel(item)
      ]);

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
          + header.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `work_orders_report_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm">
             <Wrench className="w-6 h-6 text-primary" />
          </div>
          <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">مدیریت دستور کارها</h1>
              <p className="text-xs text-gray-500 mt-1">لیست تمام درخواست‌ها و سوابق تعمیراتی</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
                 <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-sm font-medium animate-fadeIn">
                     {selectedIds.length} مورد انتخاب شده
                 </div>
            )}
            <button 
            onClick={handleExport}
            className="bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 px-4 py-2.5 rounded-xl shadow-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-600 transition font-medium"
            >
                <FileSpreadsheet className="w-5 h-5" />
                <span className="hidden md:inline">خروجی اکسل</span>
            </button>
            <button 
            onClick={() => navigate('/work-orders/new')}
            className="bg-primary text-white px-4 py-2.5 rounded-xl shadow-lg shadow-red-900/20 flex items-center gap-2 hover:bg-red-800 transition transform active:scale-95 font-medium"
            >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">ثبت درخواست جدید</span>
            </button>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Top Bar */}
          <div className="p-4 flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                  <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="جستجو (کد، تجهیز، عنوان...)" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
              </div>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${isFilterOpen ? 'bg-primary/5 border-primary text-primary' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'}`}
              >
                  <Filter className="w-5 h-5" />
                  <span>فیلترها</span>
                  {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
          </div>

          {/* Collapsible Filter Panel */}
          {isFilterOpen && (
              <div className="px-4 pb-4 pt-0 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">وضعیت</label>
                      <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none"
                      >
                          <option value="ALL">همه وضعیت‌ها</option>
                          <option value="درخواست">درخواست جدید</option>
                          <option value="انجام">در حال انجام</option>
                          <option value="تایید">منتظر تایید</option>
                          <option value="پایان">پایان یافته</option>
                      </select>
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">از تاریخ</label>
                      <input 
                        type="text" 
                        placeholder="1403/01/01" 
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-left"
                        dir="ltr"
                      />
                  </div>
                   <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">تا تاریخ</label>
                      <input 
                        type="text" 
                        placeholder="1403/12/29" 
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-left"
                        dir="ltr"
                      />
                  </div>
                  <div className="flex items-end">
                      <button 
                        onClick={() => { setStatusFilter('ALL'); setDateFrom(''); setDateTo(''); setSearchTerm(''); }}
                        className="w-full p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition text-sm"
                      >
                          پاک کردن فیلترها
                      </button>
                  </div>
              </div>
          )}
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                      <tr>
                          <th className="p-4 w-10">
                              <input 
                                type="checkbox" 
                                onChange={handleSelectAll}
                                checked={paginatedItems.length > 0 && selectedIds.length === paginatedItems.length}
                                className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                              />
                          </th>
                          <th className="p-4">کد پیگیری</th>
                          <th className="p-4">تجهیز</th>
                          <th className="p-4">شرح خرابی / درخواست</th>
                          <th className="p-4">درخواست کننده</th>
                          <th className="p-4">تاریخ ثبت</th>
                          <th className="p-4">وضعیت</th>
                          <th className="p-4">عملیات</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                      {paginatedItems.length > 0 ? (
                          paginatedItems.map(item => (
                              <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${selectedIds.includes(item.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                  <td className="p-4">
                                      <input 
                                        type="checkbox" 
                                        checked={selectedIds.includes(item.id)}
                                        onChange={() => handleSelectOne(item.id)}
                                        className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                                      />
                                  </td>
                                  <td className="p-4 font-mono font-bold text-gray-600 dark:text-gray-300">{item.trackingCode}</td>
                                  <td className="p-4 font-bold text-gray-800 dark:text-gray-100">{item.data?.equipName || '-'}</td>
                                  <td className="p-4 text-gray-500 truncate max-w-[200px]">{item.data?.failureDesc || item.title}</td>
                                  <td className="p-4">{item.data?.requester || 'ناشناس'}</td>
                                  <td className="p-4 font-mono text-xs text-gray-500">{item.createdAt}</td>
                                  <td className="p-4">{getStatusBadge(item)}</td>
                                  <td className="p-4">
                                      <button 
                                        onClick={() => setSelectedItem(item)}
                                        className="text-primary hover:bg-primary/10 p-2 rounded-lg transition flex items-center gap-1 text-xs font-bold"
                                      >
                                          <Eye className="w-4 h-4" /> مشاهده
                                      </button>
                                  </td>
                              </tr>
                          ))
                      ) : (
                          <tr>
                              <td colSpan={8} className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
                                  <Search className="w-12 h-12 mb-4 opacity-20" />
                                  <span>موردی با این مشخصات یافت نشد.</span>
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 p-4 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>نمایش</span>
                  <select 
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-1 outline-none"
                  >
                      <option value={10}>10</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                  </select>
                  <span>ردیف در هر صفحه</span>
                  <span className="mr-2 px-2 border-r border-gray-300 dark:border-gray-600">
                      مجموع: {filteredItems.length} رکورد
                  </span>
              </div>

              <div className="flex items-center gap-1">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ChevronRight className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold">
                      صفحه {currentPage} از {Math.ceil(filteredItems.length / rowsPerPage) || 1}
                  </span>
                  <button 
                    disabled={currentPage >= Math.ceil(filteredItems.length / rowsPerPage)}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <ChevronLeft className="w-4 h-4" />
                  </button>
              </div>
          </div>
      </div>

      {/* Detail Modal (Read-Only View) */}
      {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
                  <div className="flex justify-between items-center p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                      <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{selectedItem.title}</span>
                          <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">{selectedItem.trackingCode}</span>
                      </div>
                      <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-black/20 p-4">
                      {/* Reuse WorkOrders component in read-only/executor style */}
                      <div className="pointer-events-none opacity-90">
                           <WorkOrders initialData={selectedItem.data} />
                      </div>
                  </div>
                  <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-end">
                      <button onClick={() => setSelectedItem(null)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 transition">بستن</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
