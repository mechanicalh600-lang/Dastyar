
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { generateId } from '../../utils';
import { fetchMasterData } from '../../workflowStore';
import { EntityType, COLUMNS_MAP, MANDATORY_FIELDS } from './adminConfig';

export const useAdminLogic = () => {
  const [activeTab, setActiveTab] = useState<EntityType>('user_groups');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Dropdown Lists State
  const [dropdowns, setDropdowns] = useState({
      personnel: [] as any[],
      userGroups: [] as any[],
      orgUnits: [] as any[],
      equipmentClasses: [] as any[],
      equipmentGroups: [] as any[],
      equipment: [] as any[],
      measurementUnits: [] as any[],
      allCategories: [] as any[],
      locations: [] as any[] // Added locations
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const getLocalData = (key: string) => {
      try { return JSON.parse(localStorage.getItem(`admin_data_${key}`) || '[]'); } catch { return []; }
  };

  const setLocalData = (key: string, newData: any[]) => {
      localStorage.setItem(`admin_data_${key}`, JSON.stringify(newData));
  };

  const getErrorMessage = (err: any) => {
      if (!err) return 'خطای نامشخص';
      if (typeof err === 'string') return err;
      if (err.message) return err.message;
      if (err.details) return err.details;
      try {
          const str = JSON.stringify(err);
          if (str === '{}') return String(err);
          return str;
      } catch {
          return String(err);
      }
  };

  // Helper to parse CSV line correctly handling quotes and delimiters
  const parseCSVLine = (line: string, delimiter: string) => {
      const values = [];
      let currentVal = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
              if (inQuotes && line[i+1] === '"') {
                  currentVal += '"'; // Escaped quote
                  i++;
              } else {
                  inQuotes = !inQuotes;
              }
          } else if (char === delimiter && !inQuotes) {
              values.push(currentVal.trim());
              currentVal = '';
          } else {
              currentVal += char;
          }
      }
      values.push(currentVal.trim());
      return values;
  };

  // --- Data Fetching ---
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    
    let tableName = activeTab as string;
    if (activeTab.startsWith('part_categories_')) {
        tableName = 'part_categories';
    }

    try {
      const { data: tableData, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      let processedData = tableData || [];
      
      // Process specific tables
      if (activeTab.startsWith('part_categories_')) {
          setDropdowns(prev => ({ ...prev, allCategories: tableData || [] }));
          
          if (activeTab === 'part_categories_main') {
              processedData = processedData.filter(i => i.level_type === 'MAIN');
          } else if (activeTab === 'part_categories_sub') {
              processedData = processedData
                  .filter(i => i.level_type === 'SUB')
                  .map(i => ({ ...i, parent_name: tableData?.find((p:any) => p.id === i.parent_id)?.name || '-' }));
          } else if (activeTab === 'part_categories_sub_sub') {
              processedData = processedData
                  .filter(i => i.level_type === 'SUB_SUB')
                  .map(i => {
                      const parent = tableData?.find((p:any) => p.id === i.parent_id);
                      const grandParent = parent ? tableData?.find((p:any) => p.id === parent.parent_id) : null;
                      return { ...i, parent_name: parent?.name || '-', grand_parent_name: grandParent?.name || '-' };
                  });
          }
      }

      if (activeTab === 'parts') {
          const cats = dropdowns.allCategories.length > 0 ? dropdowns.allCategories : await fetchMasterData('part_categories');
          const units = dropdowns.measurementUnits.length > 0 ? dropdowns.measurementUnits : await fetchMasterData('measurement_units');
          setDropdowns(prev => ({ ...prev, allCategories: cats, measurementUnits: units }));

          processedData = processedData.map(part => {
              const cat = cats.find((c:any) => c.id === part.category_id);
              let path = '-';
              if (cat) {
                  const parent = cats.find((c:any) => c.id === cat.parent_id);
                  const grandParent = parent ? cats.find((c:any) => c.id === parent.parent_id) : null;
                  path = `${grandParent?.name || '?'} > ${parent?.name || '?'} > ${cat.name}`;
              }
              return {
                  ...part,
                  full_category_path: path,
                  stock_unit_name: units.find((u:any) => u.id === part.stock_unit_id)?.title || '-',
                  consumption_unit_name: units.find((u:any) => u.id === part.consumption_unit_id)?.title || '-',
              };
          });
      }

      // Map Relations for other tables...
      if (activeTab === 'app_users') {
          const pList = dropdowns.personnel.length > 0 ? dropdowns.personnel : await fetchMasterData('personnel');
          setDropdowns(prev => ({ ...prev, personnel: pList }));
          processedData = processedData.map(u => {
              const person = pList.find((p: any) => p.id === u.personnel_id);
              return {
                  ...u,
                  full_name: person ? person.full_name : '---',
                  unit: person ? person.unit : '---',
                  avatar: u.avatar || (person ? person.profile_picture : null),
                  personnel_code: person ? person.personnel_code : null
              };
          });
      }

      if (activeTab === 'org_chart') {
          if (dropdowns.personnel.length === 0) setDropdowns(prev => ({ ...prev, personnel: [] })); 
          processedData = processedData.map(item => ({
              ...item,
              parent_name: processedData.find(p => p.id === item.parent_id)?.name || '-',
              manager_name: dropdowns.personnel.find(p => p.id === item.manager_id)?.full_name || item.manager_name || '-'
          }));
      }

      if (activeTab === 'locations') {
          const locs = tableData || [];
          setDropdowns(prev => ({ ...prev, locations: locs }));
          processedData = processedData.map(item => ({ ...item, parent_name: processedData.find(p => p.id === item.parent_id)?.name || '-' }));
      }

      if (activeTab === 'personnel' || activeTab === 'evaluation_criteria') {
          const orgs = await fetchMasterData('org_chart');
          setDropdowns(prev => ({ ...prev, orgUnits: orgs }));
          processedData = processedData.map(item => {
              const unitObj = orgs.find((o:any) => o.id === item.org_unit_id);
              return { ...item, unit: unitObj ? unitObj.name : (item.unit || '-'), org_unit_name: unitObj ? unitObj.name : '-' }
          });
      }

      if (activeTab === 'equipment_groups' || activeTab === 'equipment' || activeTab === 'equipment_local_names') {
          const classes = await fetchMasterData('equipment_classes');
          const groups = await fetchMasterData('equipment_groups');
          setDropdowns(prev => ({ ...prev, equipmentClasses: classes, equipmentGroups: groups }));
          processedData = processedData.map(eq => ({
              ...eq,
              class_name: classes.find((c: any) => c.id === eq.class_id)?.name || '-',
              group_name: groups.find((g: any) => g.id === eq.group_id)?.name || '-'
          }));
      }

      if (activeTab === 'equipment_tree') {
          const equips = await fetchMasterData('equipment');
          setDropdowns(prev => ({ ...prev, equipment: equips }));
          processedData = processedData.map(item => ({
              ...item,
              equipment_name: equips.find((e: any) => e.id === item.equipment_id)?.name || '-',
              parent_name: processedData.find(p => p.id === item.parent_id)?.name || '-'
          }));
      }

      setIsOfflineMode(false);
      setData(processedData);
      setLocalData(activeTab, processedData);

    } catch (err: any) {
      console.warn('Supabase fetch failed, switching to local:', err);
      setIsOfflineMode(true);
      const localData = getLocalData(activeTab);
      setData(localData);
      const msg = getErrorMessage(err);
      if(!localData.length) setErrorMsg('خطا در دریافت اطلاعات: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedIds([]);
    
    // Lazy load dropdowns
    const loadAux = async () => {
        const p = await fetchMasterData('personnel');
        const g = await fetchMasterData('user_groups');
        const o = await fetchMasterData('org_chart');
        const ec = await fetchMasterData('equipment_classes');
        const eg = await fetchMasterData('equipment_groups');
        const eq = await fetchMasterData('equipment');
        const mu = await fetchMasterData('measurement_units');
        const loc = await fetchMasterData('locations');
        setDropdowns({
            personnel: p, userGroups: g, orgUnits: o,
            equipmentClasses: ec, equipmentGroups: eg,
            equipment: eq, measurementUnits: mu, allCategories: [],
            locations: loc
        });
    };
    loadAux();
  }, [activeTab]);

  // --- CRUD Handlers ---

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    
    let payload = { ...editingItem };
    let tableName = activeTab as string;

    // Validation
    const checkFormValidity = () => {
        if (!editingItem) return false;
        // Simplified generic check based on Mandatory Fields config
        const cols = COLUMNS_MAP[activeTab];
        if (cols) {
            for (const col of cols) {
                // If column is mapped (e.g. class_name -> class_id), check the ID field
                let keyToCheck = col.key as string;
                if (keyToCheck === 'class_name') keyToCheck = 'class_id';
                if (keyToCheck === 'group_name') keyToCheck = 'group_id';
                if (keyToCheck === 'org_unit_name') keyToCheck = 'org_unit_id';

                if (MANDATORY_FIELDS.includes(keyToCheck)) {
                    if (!editingItem[keyToCheck] && editingItem[keyToCheck] !== 0) return false;
                }
            }
        }
        return true;
    };

    if (!checkFormValidity()) {
        setLoading(false);
        alert('لطفا تمام فیلدهای ستاره‌دار (اجباری) را تکمیل کنید.');
        return;
    }

    // Specific cleanups
    if (activeTab.startsWith('part_categories_')) {
        tableName = 'part_categories';
        // Check duplicate
        const isCodeDuplicate = data.some(i => i.code === payload.code && i.id !== payload.id);
        if (isCodeDuplicate) { setLoading(false); alert('کد تکراری است.'); return; }
        
        if (activeTab === 'part_categories_main') payload.level_type = 'MAIN';
        if (activeTab === 'part_categories_sub') payload.level_type = 'SUB';
        if (activeTab === 'part_categories_sub_sub') payload.level_type = 'SUB_SUB';
        
        delete payload.parent_name; delete payload.grand_parent_name; delete payload.temp_main_cat_id;
    }

    if (activeTab === 'parts') {
        delete payload.full_category_path; delete payload.temp_main_cat_id; delete payload.temp_sub_cat_id;
        delete payload.stock_unit_name; delete payload.consumption_unit_name;
    }

    if (activeTab === 'app_users') {
        delete payload.full_name; delete payload.unit; delete payload.personnel_profile; delete payload.avatar; delete payload.personnel_code;
    }

    if (activeTab === 'personnel' && payload.org_unit_id) {
        const unitObj = dropdowns.orgUnits.find((o:any) => o.id === payload.org_unit_id);
        if (unitObj) payload.unit = unitObj.name;
    }

    // Generic Cleanup of Helper Fields
    delete payload.parent_name; delete payload.manager_name; delete payload.class_name; delete payload.group_name; delete payload.equipment_name; delete payload.org_unit_name;

    try {
        if (payload.id) {
            const { error } = await supabase.from(tableName).update(payload).eq('id', payload.id);
            if (error) throw error;
        } else {
            const { error } = await supabase.from(tableName).insert([payload]);
            if (error) throw error;
        }
        await fetchData();
        setIsModalOpen(false);
    } catch (err: any) {
        if (err.code === '23505') {
            alert('خطای تکراری: رکوردی با این مشخصات قبلاً ثبت شده است.');
        } else {
            console.warn('Save failed, offline fallback:', err);
            // Offline Logic ...
            alert('⚠️ ارتباط با سرور برقرار نشد. (نسخه آزمایشی: ذخیره آفلاین)');
            setIsModalOpen(false);
        }
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm('آیا از حذف این رکورد اطمینان دارید؟')) return;
    
    // Optimistic Update
    setData(prev => prev.filter(i => i.id !== item.id));
    setSelectedIds(prev => prev.filter(id => id !== item.id));

    let tableName = activeTab as string;
    if (activeTab.startsWith('part_categories_')) tableName = 'part_categories';

    try {
        const { error } = await supabase.from(tableName).delete().eq('id', item.id);
        if (error) throw error;
        await fetchData();
    } catch (err) {
        console.warn('Delete failed, offline fallback');
        setIsOfflineMode(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`آیا از حذف ${selectedIds.length} رکورد اطمینان دارید؟`)) return;
    
    setData(prev => prev.filter(i => !selectedIds.includes(i.id)));
    let tableName = activeTab as string;
    if (activeTab.startsWith('part_categories_')) tableName = 'part_categories';

    try {
        const { error } = await supabase.from(tableName).delete().in('id', selectedIds);
        if (error) throw error;
        setSelectedIds([]);
        await fetchData();
    } catch (err) {
        console.warn('Bulk delete failed');
        setIsOfflineMode(true);
    }
  };

  const handleResetPassword = async (item: any) => {
      if (!item.personnel_code) return alert('کد پرسنلی یافت نشد.');
      if (!window.confirm('آیا از بازنشانی رمز عبور اطمینان دارید؟')) return;
      try {
          const { error } = await supabase.from('app_users').update({ password: item.personnel_code, is_default_password: true }).eq('id', item.id);
          if (error) throw error;
          alert('رمز عبور بازنشانی شد.');
      } catch (err: any) {
          alert('خطا: ' + getErrorMessage(err));
      }
  };

  // --- Export CSV Handler ---
  const handleDownloadSample = () => {
      const cols = COLUMNS_MAP[activeTab];
      const headers = cols.map(c => c.key);
      
      // Use existing data for export, or header only if empty
      const rowsToExport = data.length > 0 ? data : [];
      
      let csvContent = "\uFEFF" + headers.join(",") + "\n";
      
      rowsToExport.forEach(row => {
          const rowData = headers.map(key => {
              let val = row[key];
              if (val === null || val === undefined) val = '';
              // Handle comma in data by wrapping in quotes
              if (String(val).includes(',')) val = `"${val}"`;
              return val;
          });
          csvContent += rowData.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${activeTab}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
          let text = (evt.target?.result as string) || '';
          if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1); else text = text.replace(/^\uFEFF/, '');
          
          const rowsRaw = text.split(/\r?\n/).filter(r => r.trim() !== '');
          if (rowsRaw.length < 2) { alert('فایل خالی یا نامعتبر است.'); return; }

          const delimiter = rowsRaw[0].includes(';') ? ';' : ',';
          const headers = rowsRaw[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').trim());
          
          const dataToInsert: any[] = [];
          const errors: string[] = [];

          for (let i = 1; i < rowsRaw.length; i++) {
              const rowValues = parseCSVLine(rowsRaw[i], delimiter).map(v => v.replace(/^"|"$/g, ''));
              const rowObj: any = {};
              headers.forEach((h, idx) => { if (rowValues[idx]) rowObj[h] = rowValues[idx]; });

              // --- SMART IMPORT LOGIC ---
              
              // 1. Equipment Groups: Resolve class_name -> class_id
              if (activeTab === 'equipment_groups' && rowObj['class_name'] && !rowObj['class_id']) {
                  const cls = dropdowns.equipmentClasses.find(c => c.name === rowObj['class_name']);
                  if (cls) rowObj['class_id'] = cls.id;
              }

              // 2. Equipment & Local Names: Resolve class_name -> class_id AND group_name -> group_id
              if ((activeTab === 'equipment' || activeTab === 'equipment_local_names')) {
                  if (rowObj['class_name'] && !rowObj['class_id']) {
                      const cls = dropdowns.equipmentClasses.find(c => c.name === rowObj['class_name']);
                      if (cls) rowObj['class_id'] = cls.id;
                  }
                  if (rowObj['group_name'] && !rowObj['group_id']) {
                      // Filter groups by class if available
                      const possibleGroups = rowObj['class_id'] 
                          ? dropdowns.equipmentGroups.filter(g => g.class_id === rowObj['class_id']) 
                          : dropdowns.equipmentGroups;
                          
                      const grp = possibleGroups.find(g => g.name === rowObj['group_name']);
                      if (grp) rowObj['group_id'] = grp.id;
                  }
              }

              // 3. Personnel: Resolve org_unit_name -> org_unit_id
              if (activeTab === 'personnel' && rowObj['org_unit_name'] && !rowObj['org_unit_id']) {
                  const org = dropdowns.orgUnits.find(o => o.name === rowObj['org_unit_name']);
                  if (org) {
                      rowObj['org_unit_id'] = org.id;
                      rowObj['unit'] = org.name; // Keep legacy field sync
                  }
              }

              // 4. Equipment Tree: Resolve Equipment Name
              if (activeTab === 'equipment_tree' && rowObj['equipment_name'] && !rowObj['equipment_id']) {
                  const eq = dropdowns.equipment.find(e => e.name === rowObj['equipment_name']);
                  if (eq) rowObj['equipment_id'] = eq.id;
              }

              // Special handling for app_users CSV import
              if (activeTab === 'app_users' && rowObj['personnel_code']) {
                  const person = dropdowns.personnel.find(p => p.personnel_code === rowObj['personnel_code']);
                  if (person) {
                      rowObj['personnel_id'] = person.id;
                      rowObj['password'] = rowObj['personnel_code'];
                      rowObj['is_default_password'] = true;
                  }
              }
              
              // Cleanup
              const keysToRemove = ['class_name', 'group_name', 'org_unit_name', 'personnel_code', 'parent_name', 'grand_parent_name', 'equipment_name', 'manager_name', 'full_category_path', 'stock_unit_name', 'consumption_unit_name'];
              keysToRemove.forEach(k => delete rowObj[k]);

              if (Object.keys(rowObj).length > 0) dataToInsert.push(rowObj);
          }

          if (dataToInsert.length === 0) return alert('داده‌ای برای درج یافت نشد.');

          setLoading(true);
          try {
              let tableName = activeTab as string;
              if (activeTab.startsWith('part_categories_')) tableName = 'part_categories';
              
              const { error } = await supabase.from(tableName).insert(dataToInsert);
              if (error) throw error;
              alert('آپلود با موفقیت انجام شد.');
              fetchData();
          } catch (err: any) {
              console.error('Upload Error:', err);
              const msg = getErrorMessage(err);
              if (err.code === '23505') alert('⛔ خطای تکراری.');
              else if (err.code === '42703') alert('⛔ خطای ساختار ستون‌ها.');
              else alert(`⚠️ خطا: ${msg}`);
          } finally {
              setLoading(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  return {
      activeTab, setActiveTab,
      data, loading, errorMsg, isOfflineMode,
      isModalOpen, setIsModalOpen,
      editingItem, setEditingItem,
      selectedIds, setSelectedIds,
      dropdowns,
      fileInputRef,
      fetchData, handleSave, handleDelete, handleBulkDelete, handleResetPassword, handleFileUpload, handleDownloadSample
  };
};
