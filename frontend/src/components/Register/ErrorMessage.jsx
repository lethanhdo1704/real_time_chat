// frontend/src/components/Register/ErrorMessage.jsx

export default function ErrorMessage({ message, type = "error" }) {
  if (!message) return null;

  const isError = type === "error";
  const bgColor = isError ? "bg-red-50" : "bg-green-50";
  const borderColor = isError ? "border-red-200" : "border-green-200";
  const textColor = isError ? "text-red-700" : "text-green-700";

  return (
    <div className={`flex items-center gap-2 text-sm ${textColor} ${bgColor} border ${borderColor} px-4 py-3 rounded-xl`}>
      <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        {isError ? (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        ) : (
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        )}
      </svg>
      <span>{message}</span>
    </div>
  );
}