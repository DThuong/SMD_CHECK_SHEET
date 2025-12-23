import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { useTranslation } from 'react-i18next';

interface LCRFileViewerProps {
  fileUrl?: string;
  file?: File;
}

const LCRFileViewer = ({ fileUrl, file }: LCRFileViewerProps) => {
  const { t } = useTranslation();
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExcelFile = async () => {
      if (!fileUrl && !file) return;

      setLoading(true);
      setError(null);

      try {
        let arrayBuffer: ArrayBuffer;

        // Nếu có file local
        if (file) {
          arrayBuffer = await file.arrayBuffer();
        }
        // Nếu có URL từ server
        else if (fileUrl) {
          const response = await fetch(fileUrl);
          if (!response.ok) throw new Error('Failed to fetch file');
          arrayBuffer = await response.arrayBuffer();
        } else {
          return;
        }

        // Parse Excel file
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to 2D array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '' 
        }) as any[][];
        
        setData(jsonData);
      } catch (err: any) {
        console.error('Error loading Excel:', err);
        setError(err.message || 'Failed to load Excel file');
      } finally {
        setLoading(false);
      }
    };

    loadExcelFile();
  }, [fileUrl, file]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading Excel file...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">❌ {error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-100 font-semibold' : ''}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="border border-gray-300 px-3 py-2 text-sm whitespace-nowrap"
                >
                  {cell !== null && cell !== undefined ? String(cell) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LCRFileViewer;