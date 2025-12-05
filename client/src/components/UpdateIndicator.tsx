import { useState, useEffect } from 'react';

interface UpdateIndicatorProps {
  isUpdating: boolean;
}

export default function UpdateIndicator({ isUpdating }: UpdateIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isUpdating) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isUpdating]);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-fade-in">
      <span>✓</span>
      <span className="text-sm font-medium">Saved to Excel</span>
    </div>
  );
}

