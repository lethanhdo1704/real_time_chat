// frontend/src/components/common/BanToast.jsx
import { useEffect, useState } from 'react';

export default function BanToast({ message, isVisible, onClose }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onClose, 300); // Wait for animation
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg max-w-md w-full text-center animate-fade-in">
      {message}
    </div>
  );
}