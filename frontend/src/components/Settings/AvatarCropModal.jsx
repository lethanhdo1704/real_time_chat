// frontend/src/components/Settings/AvatarCropModal.jsx
import { useTranslation } from "react-i18next";
import { Check, ZoomIn, RotateCw } from "lucide-react";
import { useAvatarCrop } from "../../hooks/settings/useAvatarCrop";

export default function AvatarCropModal({ originalImage, onConfirm, onCancel }) {
  const { t } = useTranslation("settings");
  
  const {
    canvasRef,
    imageRef,
    zoom,
    rotation,
    setZoom,
    setRotation,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    drawImage,
    getCroppedImage,
  } = useAvatarCrop(originalImage);

  const handleConfirm = () => {
    const croppedDataUrl = getCroppedImage();
    if (croppedDataUrl) {
      onConfirm(croppedDataUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">
            {t("settings.crop.title")}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t("settings.crop.subtitle")}
          </p>
        </div>

        {/* Canvas Area */}
        <div className="p-6">
          <div className="flex justify-center mb-6">
            <div
              className="relative bg-gray-100 rounded-full overflow-hidden cursor-move"
              style={{ width: "256px", height: "256px" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas ref={canvasRef} className="absolute inset-0" />
              <img
                ref={imageRef}
                src={originalImage}
                alt="Original"
                className="hidden"
                onLoad={drawImage}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  {t("settings.crop.zoom")}
                </label>
                <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Rotation Control */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  {t("settings.crop.rotate")}
                </label>
                <span className="text-sm text-gray-500">{rotation}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t("settings.crop.cancel")}
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {t("settings.crop.confirm")}
          </button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: #e5e7eb;
          outline: none;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          transition: all 0.2s;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          background: #2563eb;
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          background: #2563eb;
        }
      `}</style>
    </div>
  );
}