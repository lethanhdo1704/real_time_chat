// admin/components/common/SuccessMessage.jsx

import React from 'react';
import { CheckCircle } from 'lucide-react';

const SuccessMessage = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
      <CheckCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default SuccessMessage;