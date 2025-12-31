import { useTranslation } from "react-i18next";

export default function ForgotPasswordHeader({ step }) {
  const { t } = useTranslation("forgotPassword");
  
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-linear-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg mb-4">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">
        {t("title")}
      </h2>
      <p className="text-gray-600">
        {step === 1 
          ? t("subtitle.step1")
          : t("subtitle.step2")
        }
      </p>
    </div>
  );
}