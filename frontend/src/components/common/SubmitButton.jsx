// frontend/src/components/common/SubmitButton.jsx
export default function SubmitButton({
  isLoading = false,
  disabled = false,
  loadingText,
  children,
}) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className="w-full bg-linear-to-r from-indigo-600 to-purple-600
                 hover:from-indigo-700 hover:to-purple-700
                 text-white py-3.5 rounded-xl font-semibold
                 shadow-lg hover:shadow-xl transition-all
                 disabled:opacity-60 disabled:cursor-not-allowed
                 transform hover:scale-[1.02] active:scale-[0.98]"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
