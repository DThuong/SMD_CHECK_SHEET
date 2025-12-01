import React, { useState, useEffect } from 'react';
import SmdSheetUser from "../components/SmdSheetUser";

// Home.tsx
// - Hiển thị tab: "Create New Sheet" và "Existing Sheets"
// - Khi tạo mới: gọi API POST /api/sheets (ví dụ) để backend tạo sheet rỗng
// - Có filter: workOrder (text) và date range (from/to) để lấy sheet đã điền
// - Kết quả filter được truyền xuống SmdSheetUser thông qua props (nếu component hỗ trợ)

type SheetFilter = {
  workOrder: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
};

const Home = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // filter state
  const [filter, setFilter] = useState<SheetFilter>({
    workOrder: '',
    fromDate: '',
    toDate: ''
  });

  // sheets list (optional local preview). If your SmdSheetUser handles fetching itself, you can instead
  // pass `filter` as props and let it fetch. Here we keep a local list for demonstration.
  const [sheets, setSheets] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // call backend to create a new (empty) sheet
  const createNewSheet = async () => {
    setLoadingCreate(true);
    setMessage(null);
    try {
      // Thay URL bằng endpoint thực tế của bạn
      const res = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // backend sẽ tạo sheet rỗng
      });
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const data = await res.json();
      setMessage('Sheet created successfully.');
      // chuyển sang tab danh sách và refresh
      setActiveTab('list');
      await fetchSheets(filter);
      // nếu bạn muốn tự động mở SmdSheetUser cho sheet mới, truyền id vào props hoặc điều hướng
      // example: navigate(`/sheets/${data.id}/edit`)
    } catch (err: any) {
      setMessage(err?.message || 'Create failed');
    } finally {
      setLoadingCreate(false);
    }
  };

  // fetch sheets with filter
  const fetchSheets = async (f: SheetFilter) => {
    setLoadingList(true);
    setMessage(null);
    try {
      // build query params
      const params = new URLSearchParams();
      if (f.workOrder) params.set('workOrder', f.workOrder);
      if (f.fromDate) params.set('fromDate', f.fromDate);
      if (f.toDate) params.set('toDate', f.toDate);

      const res = await fetch(`/api/sheets?${params.toString()}`, { method: 'GET' });
      if (!res.ok) throw new Error('Failed to fetch sheets');
      const data = await res.json();
      setSheets(data || []);
    } catch (err: any) {
      setMessage(err?.message || 'Fetch failed');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    // initial load for list tab
    if (activeTab === 'list') fetchSheets(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-4">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 mx-3">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-md ${activeTab === 'create' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Create New Sheet
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md ${activeTab === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            Existing Sheets
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'create' && (
          <div className="my-4">
                      {/* Option B: truyền props filter và sheets cho SmdSheetUser */}
            <div className="mt-4">
              <SmdSheetUser />
            </div>
          </div>
          
        )}

        {activeTab === 'list' && (
          <div className="my-4">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm text-gray-700">Work Order</label>
                <input
                  value={filter.workOrder}
                  onChange={(e) => setFilter((s) => ({ ...s, workOrder: e.target.value }))}
                  placeholder="Enter work order"
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700">From</label>
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={filter.fromDate}
                  onChange={(e) => setFilter((s) => ({ ...s, fromDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700">To</label>
                <input
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={filter.toDate}
                  onChange={(e) => setFilter((s) => ({ ...s, toDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div className="sm:col-span-3 flex gap-2">
                <button
                  onClick={() => fetchSheets(filter)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md"
                >
                  {loadingList ? 'Loading…' : 'Search'}
                </button>

                <button
                  onClick={() => {
                    setFilter({ workOrder: '', fromDate: '', toDate: '' });
                    setSheets([]);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Results preview or pass filter to SmdSheetUser */}
            <div>
              {/* Option A: render a simple list preview here */}
              {sheets.length > 0 ? (
                <div className="grid gap-2">
                  {sheets.map((s) => (
                    <div key={s.id} className="p-3 border rounded">
                      <div className="text-sm font-medium">Work Order: {s.workOrder}</div>
                      <div className="text-xs text-gray-500">Date: {s.date}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No sheets found. Try adjusting filters.</div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
