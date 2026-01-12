// frontend/src/user/components/Chat/FileUpload/FileUploadButton.jsx

import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 🔥 FINAL CORRECT VERSION: FileUploadButton
 * 
 * Fixed issues:
 * 1. ✅ Proper ref attached to input
 * 2. ✅ PAPERCLIP icon (NOT plus sign!)
 * 3. ✅ Inline style for hidden input
 * 4. ✅ Debug logs for troubleshooting
 */
export default function FileUploadButton({ onFilesSelect, disabled = false }) {
  const { t } = useTranslation('chat');
  const fileInputRef = useRef(null);

  console.log('🔍 [FileUploadButton] Render:', {
    hasCallback: !!onFilesSelect,
    disabled,
    refAttached: !!fileInputRef.current,
  });

  const handleClick = (e) => {
    console.log('🔍 [FileUploadButton] Button clicked');
    console.log('🔍 [FileUploadButton] fileInputRef.current:', fileInputRef.current);
    
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) {
      console.warn('⚠️ [FileUploadButton] Button is disabled');
      return;
    }
    
    if (!fileInputRef.current) {
      console.error('❌ [FileUploadButton] Input ref is null!');
      
      // Fallback: try to find input manually
      const input = document.querySelector('input[type="file"][data-upload-button="true"]');
      if (input) {
        console.log('✅ [FileUploadButton] Found input manually, clicking it');
        input.click();
      }
      return;
    }
    
    console.log('✅ [FileUploadButton] Triggering input click via ref...');
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    console.log('📁 [FileUploadButton] File input changed');
    console.log('📁 [FileUploadButton] Files:', e.target.files);
    
    const files = e.target.files;
    
    if (!files || files.length === 0) {
      console.warn('⚠️ [FileUploadButton] No files selected');
      return;
    }

    const fileArray = Array.from(files);
    console.log('📁 [FileUploadButton] Files array:', fileArray.map(f => ({
      name: f.name,
      size: f.size,
      type: f.type,
    })));

    if (!onFilesSelect) {
      console.error('❌ [FileUploadButton] onFilesSelect callback is missing!');
      return;
    }

    console.log('✅ [FileUploadButton] Calling onFilesSelect...');
    onFilesSelect(fileArray);
    
    // Reset input value to allow selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      console.log('✅ [FileUploadButton] Input value reset');
    }
  };

  return (
    <>
      {/* 🔥 Hidden File Input with proper ref */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar,.7z"
        onChange={handleFileChange}
        onClick={() => console.log('📁 [FileUploadButton] Input clicked directly')}
        disabled={disabled}
        style={{ display: 'none' }}
        data-upload-button="true"
        data-testid="file-upload-input"
      />

      {/* 🔥 Upload Button with PAPERCLIP icon (NOT PLUS!) */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`
          flex h-9 w-9 shrink-0 
          items-center justify-center 
          rounded-full
          transition-all duration-200
          ${
            disabled
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95"
          }
        `}
        title={t("input.uploadFile") || "Upload file"}
        data-testid="file-upload-button"
      >
        {/* 
          🔥🔥🔥 CRITICAL: PAPERCLIP ICON 🔥🔥🔥
          DO NOT CHANGE THIS PATH!
          This is the attachment/paperclip icon, NOT a plus sign!
        */}
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>
    </>
  );
}