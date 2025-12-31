import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import SubmitButton from "../common/SubmitButton";

export default function RegisterFooter({ submitting }) {
  const { t } = useTranslation("register");

  return (
    <>
      {/* Submit Button */}
      <SubmitButton
        isLoading={submitting}
        loadingText="registering"
        buttonText="registerButton"
        translationNamespace="register"
      />

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          {t("haveAccount")}{" "}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
            {t("loginNow")}
          </Link>
        </p>
      </div>
    </>
  );
}