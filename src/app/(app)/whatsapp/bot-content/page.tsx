"use client";
import React from "react";
import { botAddField, botCreateRow, botListData, botListFields, botUploadExcel, botDeleteRow, botUpdateRow, botDeleteField, botExportData, type BotField, type BotDataRow } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Loader from "@/components/Loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type EditableCellProps = {
  value: any;
  onChange: (v: any) => void;
  type?: string;
};

function EditableCell({ value, onChange, type = 'text' }: EditableCellProps) {
  return (
    <input
      className="border-[0.5px] border-white/60 outline-none rounded px-3 py-2 text-white"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      type={type}
    />
  );
}

export default function BotContentPage() {
  const { user, loading: authLoading } = useAuth();
  const [fields, setFields] = React.useState<BotField[]>([]);
  const [rows, setRows] = React.useState<BotDataRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [newFieldName, setNewFieldName] = React.useState('');
  const [newFieldType, setNewFieldType] = React.useState<'string' | 'number' | 'boolean' | 'date' | 'text'>('string');
  const [showAddField, setShowAddField] = React.useState(false);
  const [showAddRow, setShowAddRow] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<number | null>(null);
  const [editingData, setEditingData] = React.useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);
  const [successMessage, setSuccessMessage] = React.useState('');
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  
  // Loading states for operations
  const [isAddingField, setIsAddingField] = React.useState(false);
  const [isAddingRow, setIsAddingRow] = React.useState(false);
  const [isUpdatingRow, setIsUpdatingRow] = React.useState(false);
  const [isDeletingRow, setIsDeletingRow] = React.useState(false);
  const [isClearingData, setIsClearingData] = React.useState(false);
  const [isUploadingExcel, setIsUploadingExcel] = React.useState(false);
  const [isExportingData, setIsExportingData] = React.useState(false);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user) {
      alert('يجب تسجيل الدخول أولاً');
      window.location.href = '/sign-in';
      return;
    }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        return;
      }

      const [fieldsRes, rowsRes] = await Promise.all([
        botListFields(token),
        botListData(token)
      ]);
      
      
      console.log('Fields from API:', fieldsRes.fields);
      console.log('Rows from API:', rowsRes.rows);
      if (fieldsRes.fields) setFields(fieldsRes.fields);
      if (rowsRes.rows) setRows(rowsRes.rows);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddField = async () => {
    if (!newFieldName.trim()) return;
    
    try {
      setIsAddingField(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        setIsAddingField(false);
        return;
      }

      const res = await botAddField(token, {
        fieldName: newFieldName.trim(),
        fieldType: newFieldType
      });
      
      if (res.field) {
        setNewFieldName('');
        setShowAddField(false);
        setSuccessMessage('تم إضافة العمود بنجاح');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadData();
      } else {
        alert('فشل في إضافة العمود');
      }
    } catch (error) {
      console.error('Error adding field:', error);
      alert('فشل في إضافة العمود لا يمكن اضافة اسم عمود موجود مسبقا');
    } finally {
      setIsAddingField(false);
    }
  };

  const handleAddRow = async () => {
    try {
      setIsAddingRow(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        setIsAddingRow(false);
        return;
      }

      const res = await botCreateRow(token, editingData);
      
      if (res.row) {
        setEditingData({});
        setShowAddRow(false);
        setSuccessMessage('تم إضافة الصف بنجاح');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadData();
      } else {
        alert('فشل في إضافة الصف');
      }
    } catch (error) {
      console.error('Error adding row:', error);
      alert('فشل في إضافة الصف');
    } finally {
      setIsAddingRow(false);
    }
  };

  const handleUpdateRow = async (rowId: number) => {
    try {
      setIsUpdatingRow(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        setIsUpdatingRow(false);
        return;
      }

      const res = await botUpdateRow(token, rowId, editingData);
      
      if (res.row) {
        setEditingData({});
        setEditingRow(null);
        setSuccessMessage('تم تحديث الصف بنجاح');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadData();
      } else {
        alert('فشل في تحديث الصف');
      }
    } catch (error) {
      console.error('Error updating row:', error);
      alert('فشل في تحديث الصف');
    } finally {
      setIsUpdatingRow(false);
    }
  };

  const handleDeleteRow = async (rowId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصف؟')) return;
    
    try {
      setIsDeletingRow(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        setIsDeletingRow(false);
        return;
      }

      const res = await botDeleteRow(token, rowId);
      
      if (res.ok) {
        setSuccessMessage('تم حذف الصف بنجاح');
        setTimeout(() => setSuccessMessage(''), 3000);
        loadData();
      } else {
        alert('فشل في حذف الصف');
      }
    } catch (error) {
      console.error('Error deleting row:', error);
      alert('فشل في حذف الصف');
    } finally {
      setIsDeletingRow(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      setIsClearingData(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        setIsClearingData(false);
        return;
      }

      // Delete all rows
      for (const row of rows) {
        await botDeleteRow(token, row.id);
      }
      
      // Delete all fields
      for (const field of fields) {
        await botDeleteField(token, field.id);
      }

      setSuccessMessage('تم حذف جميع البيانات بنجاح');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowClearConfirm(false);
      loadData();
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('فشل في حذف البيانات');
    } finally {
      setIsClearingData(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingExcel(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        setIsUploadingExcel(false);
        return;
      }

      const res = await botUploadExcel(token, file);
      
      if (res.success) {
        setSuccessMessage(`تم رفع الملف بنجاح! تم إنشاء ${res.fieldsCreated} عمود و ${res.rowsCreated} صف`);
        setTimeout(() => setSuccessMessage(''), 5000);
        loadData();
      } else {
        alert('فشل في رفع الملف');
      }
    } catch (error) {
      console.error('Error uploading Excel:', error);
      alert('فشل في رفع الملف');
    } finally {
      setIsUploadingExcel(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExportingData(true);
      const token = localStorage.getItem('auth_token');
      if (!token) {
        alert('يجب تسجيل الدخول أولاً');
        setIsExportingData(false);
        return;
      }

      if (rows.length === 0) {
        alert('لا توجد بيانات للتصدير');
        setIsExportingData(false);
        return;
      }

      const blob = await botExportData(token);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bot_content_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage('تم تصدير البيانات بنجاح!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('فشل في تصدير البيانات');
    } finally {
      setIsExportingData(false);
    }
  };

  const startEditRow = (row: BotDataRow) => {
    setEditingRow(row.id);
    setEditingData({ ...row.data });
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditingData({});
  };

  // Pagination
  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRows = rows.slice(startIndex, endIndex);

  // Show fullscreen loader during operations
  if (isAddingField || isAddingRow || isUpdatingRow || isDeletingRow || isClearingData || isUploadingExcel || isExportingData) {
    let loaderText = "جاري المعالجة...";
    if (isAddingField) loaderText = "جاري إضافة العمود...";
    else if (isAddingRow) loaderText = "جاري إضافة الصف...";
    else if (isUpdatingRow) loaderText = "جاري تحديث الصف...";
    else if (isDeletingRow) loaderText = "جاري حذف الصف...";
    else if (isClearingData) loaderText = "جاري حذف جميع البيانات...";
    else if (isUploadingExcel) loaderText = "جاري رفع ملف Excel...";
    else if (isExportingData) loaderText = "جاري تصدير البيانات...";
    
    return (
      <Loader 
        text={loaderText} 
        size="lg" 
        variant="success"
        showDots
        fullScreen
      />
    );
  }

  if (authLoading || loading) {
    return (
      <Loader 
        text="جاري تحميل البيانات..." 
        size="lg" 
        variant="warning"
        showDots
        fullScreen
      />
    );
  }

  return (
    <div className="w-full mx-auto ">
         <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold mb-6 text-white">إدارة محتوى البوت</h1>

                {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setShowAddField(true)}
            className="primary-button after:bg-[#131240]  text-white px-4 py-2 rounded"
          >
            إضافة عمود جديد
          </button>
          
          <button
            onClick={() => setShowAddRow(true)}
            className="primary-button after:bg-[#131240]  text-white px-4 py-2 rounded"
          >
            إضافة صف جديد
          </button>
          
          <label className="primary-button after:bg-[#131240]  text-white px-4 py-2 rounded cursor-pointer">
            رفع ملف Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
              className="hidden"
            />
          </label>
          
          {rows.length > 0 && (
            <button
              onClick={handleExportData}
              disabled={loading}
              className="primary-button  text-white px-4 py-2 rounded"
            >
              {loading ? 'جاري التصدير...' : 'تصدير إلى Excel'}
            </button>
          )}
          
          {(fields.length > 0 || rows.length > 0) && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              حذف جميع البيانات
            </button>
          )}
        </div>
      </div>
          </div>   

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-3 rounded">
          {successMessage}
        </div>
      )}


      {/* Add Field Modal */}
      {showAddField && (
        <div className="fixed inset-0 backdrop-blur-lg  flex items-center justify-center z-50">
          <div className="gradient-border p-6 rounded-lg w-full max-w-3xl" style={{backgroundColor: 'black'}}>
            <h3 className="text-lg font-semibold mb-4 text-white">إضافة عمود جديد</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">اسم العمود</label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full border-[0.5px] border-white/60 outline-none rounded px-3 py-2 text-white"
                  placeholder="مثال: اسم_المنتج"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">نوع العمود</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as 'string' | 'number' | 'boolean' | 'date' | 'text')}
                  className="w-full border-[0.5px] border-white/60 outline-none rounded px-3 py-2 text-white appearance-none"
                >
                  <option value="string">نص</option>
                  <option value="number">رقم</option>
                  <option value="boolean">نعم/لا</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddField}
                  className="primary-button  text-white px-4 py-2 rounded"
                >
                  إضافة
                </button>
                <button
                  onClick={() => setShowAddField(false)}
                  className="primary-button after:bg-red-500 before:bg-red-500 text-white px-4 py-2 rounded"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Row Modal */}
      {showAddRow && (
        <div className="fixed inset-0  backdrop-blur-lg flex items-center justify-center z-50">
          <div className="gradient-border bg-black p-6 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto" style={{backgroundColor: 'black'}}>
            <h3 className="text-lg font-semibold mb-4 text-white">إضافة صف جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* {fields.map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-medium mb-2 text-white">{field.fieldName}</label>
                  <EditableCell
                  
                    value={editingData[field.fieldName] || ''}
                    onChange={(value) => setEditingData(prev => ({ ...prev, [field.fieldName]: value }))}
                    type={field.fieldType === 'number' ? 'number' : 'text'}
                  />
                </div>
              ))} */}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddRow}
                className="primary-button  text-white px-4 py-2 rounded"
              >
                إضافة
              </button>
              <button
                onClick={() => setShowAddRow(false)}
                className="primary-button after:bg-red-500 before:bg-red-500 text-white px-4 py-2 rounded"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="gradient-border p-6 rounded-lg max-w-2xl" style={{backgroundColor: 'black'}}>
            <h3 className="text-lg font-semibold mb-4 text-white">تأكيد الحذف</h3>
            <p className="mb-4 text-white">
              هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClearAllData}
                className="bg-red-500 inner-shadow hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                نعم، احذف الكل
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="bg-light-custom inner-shadow text-white px-4 py-2 rounded"
              >
                تراجع والغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      {fields.length === 0 && rows.length === 0 ? (
        <div className="bg-transparent rounded-lg p-8 text-center flex flex-col items-center justify-center mt-0 xl:mt-20">
          <img src="/head.gif" alt="" />
          <h3 className="text-2xl font-bold text-white mb-2">يرجى اضافة بيانات لذاكرة الذكاء الاصطناعي</h3>
          <h3 className="text-xl  text-white mb-2"><span className="text-red-500">ملاحظة:</span>عزيزي العميل كلما كانت البيانات بشكل تفصيلي أكثر كلما كان رد البوت بشكل احترافي أكثر </h3>
        </div>
      ) : (
        <div className="bg-transparent rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-[#01191040] inner-shadow  mb-2">
            <h3 className="text-lg font-medium text-white">
              البيانات ({rows.length} صف، {fields.length} عمود)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table >
              <TableHeader >
                <TableRow>
                  {fields.map(field => (
                    <TableHead key={field.id} >
                      {field.fieldName}
                    </TableHead>
                  ))}
                  <TableHead>
                    الإجراءات
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentRows.map(row => (
                  <TableRow key={row.id}>
                    {fields.map(field => (
                      <TableCell key={field.id} className="px-6 py-4 text-sm text-gray-900 min-w-[200px]">
                        {editingRow === row.id ? (
                          <EditableCell
                            value={editingData[field.fieldName] || ''}
                            onChange={(value) => setEditingData(prev => ({ ...prev, [field.fieldName]: value }))}
                            type={field.fieldType === 'number' ? 'number' : 'text'}
                          />
                        ) : (
                          <div className="w-full">
                            <div className="break-words whitespace-pre-wrap text-sm max-h-32 overflow-y-auto text-white rounded p-2 bg-[#01191040] min-h-[40px] max-w-[300px]">
                              {row.data[field.fieldName] !== undefined && row.data[field.fieldName] !== null && row.data[field.fieldName] !== '' 
                                ? String(row.data[field.fieldName]) 
                                : <span className="text-gray-400 italic">فارغ</span>}
                            </div>
                          </div>
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="px-6 py-4 whitespace-nowrap  text-sm font-medium flex justify-end items-center" >
                      {editingRow === row.id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateRow(row.id)}
                            className="primary-button  text-white  rounded"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="primary-button after:bg-red-500 before:bg-red-500 text-white  rounded"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-end items-center">
                          <button
                            onClick={() => startEditRow(row)}
                            className="primary-button  text-white  rounded"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="primary-button after:bg-red-500 before:bg-red-500 text-white  rounded"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-secondry px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-3 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  السابق
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-3 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  التالي
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-300">
                    عرض <span className="font-medium">{startIndex + 1}</span> إلى <span className="font-medium">{Math.min(endIndex, rows.length)}</span> من <span className="font-medium">{rows.length}</span> نتيجة
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      السابق
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      التالي
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

