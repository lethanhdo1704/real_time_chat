// frontend/src/user/pages/TermsOfService.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Scale, ChevronLeft, Printer, Download, Menu, X } from "lucide-react";

export default function TermsOfService() {
  const { t, i18n } = useTranslation("policy");
  const [showTableOfContents, setShowTableOfContents] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  const policyData = t("terms.sections", { returnObjects: true });
  const policyTitle = t("terms.title");
  const lastUpdated = t("terms.lastUpdated");

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
      setShowTableOfContents(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -80% 0px" }
    );

    const sections = document.querySelectorAll("[data-section]");
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const handlePrint = () => window.print();
  const handleDownload = () => alert(t("common.downloadPDF") + " - Coming soon!");
  const handleBack = () => window.close();

  // Render section with deeply nested content
  const renderSection = (section) => {
    return (
      <div className="space-y-4">
        {section.content && (
          <p className="text-gray-700 leading-relaxed">{section.content}</p>
        )}

        {section.items && Array.isArray(section.items) && (
          <ul className="space-y-2 ml-6">
            {section.items.map((item, idx) => (
              <li key={idx} className="text-gray-700 leading-relaxed flex">
                <span className="text-purple-600 mr-3 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Handle nested objects (responsibilities, restrictions, prohibited, etc) */}
        {Object.entries(section).map(([subKey, subValue]) => {
          if (["title", "content", "items", "byUser", "byUs"].includes(subKey)) {
            // Handle special text fields
            if (subKey === "byUser" || subKey === "byUs") {
              return (
                <div key={subKey} className="ml-4 mt-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-600">
                  <p className="text-gray-700 leading-relaxed">
                    <span className="font-semibold text-purple-900">
                      {subKey === "byUser" ? "Bởi bạn:" : "Bởi chúng tôi:"} 
                    </span> {subValue}
                  </p>
                </div>
              );
            }
            return null;
          }
          
          if (typeof subValue === "object" && subValue !== null) {
            return (
              <div key={subKey} className="ml-4 mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-gray-300">
                {subValue.title && (
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                    {subValue.title}
                  </h4>
                )}
                {subValue.content && (
                  <p className="text-gray-700 mb-2 leading-relaxed">{subValue.content}</p>
                )}
                {subValue.items && Array.isArray(subValue.items) && (
                  <ul className="space-y-2 ml-4 mt-3">
                    {subValue.items.map((item, idx) => (
                      <li key={idx} className="text-gray-700 text-sm flex leading-relaxed">
                        <span className="text-purple-600 mr-2 font-bold">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{t("common.backToApp")}</span>
            </button>

            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-purple-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {policyTitle}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTableOfContents(!showTableOfContents)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showTableOfContents ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <button
                onClick={handlePrint}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleDownload}
                className="hidden sm:flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            {lastUpdated}: {t("common.lastUpdatedDate", { 
              date: new Date().toLocaleDateString(i18n.language === "vi" ? "vi-VN" : "en-US")
            })}
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Table of Contents - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {t("common.tableOfContents")}
                </h3>
                <nav className="space-y-2">
                  {Object.keys(policyData).map((key) => {
                    const section = policyData[key];
                    const sectionTitle = section.title || key;
                    const isActive = activeSection === key;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => scrollToSection(key)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                          ${isActive 
                            ? "bg-purple-50 text-purple-600 font-medium" 
                            : "text-gray-600 hover:bg-gray-50"
                          }
                        `}
                      >
                        {sectionTitle}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Table of Contents - Mobile */}
          {showTableOfContents && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowTableOfContents(false)}>
              <div 
                className="absolute top-0 left-0 w-80 max-w-[85vw] h-full bg-white shadow-xl p-6 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                  {t("common.tableOfContents")}
                </h3>
                <nav className="space-y-2">
                  {Object.keys(policyData).map((key) => {
                    const section = policyData[key];
                    const sectionTitle = section.title || key;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => scrollToSection(key)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        {sectionTitle}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          )}

          {/* Content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-12">
              <div className="prose prose-purple max-w-none">
                {Object.entries(policyData).map(([key, section]) => (
                  <section
                    key={key}
                    id={key}
                    data-section
                    className="mb-12 scroll-mt-24"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                      {section.title || key}
                    </h2>
                    {renderSection(section)}
                  </section>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>

      <style>{`
        @media print {
          header, aside, button {
            display: none !important;
          }
          main {
            max-width: 100% !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}