import { ReactNode, useState, useEffect } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [excelPath, setExcelPath] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/applications/excel-path')
      .then(res => res.json())
      .then(data => setExcelPath(data.path))
      .catch(err => console.error('Error fetching Excel path:', err));
  }, []);

  const handleOpenExcel = () => {
    if (excelPath) {
      // Show the path and provide instructions
      const message = `Excel file location:\n\n${excelPath}\n\nYou can:\n1. Copy this path and open it in Finder/File Explorer\n2. Or open it directly from your file manager\n\nThe file is automatically saved every time you make changes.`;
      alert(message);
      
      // Try to open the folder containing the file
      if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
        // For macOS, we can't directly open files, but we can show the path
        console.log('Excel file path:', excelPath);
      }
    } else {
      alert('Excel file path not available. The file will be created when you add your first application.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Link ATS Tracker</h1>
            <button
              onClick={handleOpenExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm flex items-center gap-2"
              title={excelPath || 'Excel file location'}
            >
              <span>📊</span>
              <span>Open Excel File</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

