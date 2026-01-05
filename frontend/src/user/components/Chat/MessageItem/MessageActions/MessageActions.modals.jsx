import RecallMessageModal from "./RecallMessageModal";
import HideMessageModal from "./HideMessageModal";

/**
 * Modals Wrapper Component
 */
export const MessageModals = ({
  showRecallModal,
  showHideModal,
  onCloseRecall,
  onCloseHide,
  onConfirmRecall,
  onConfirmHide,
}) => {
  return (
    <>
      {/* Recall Message Modal */}
      <RecallMessageModal
        isOpen={showRecallModal}
        onClose={onCloseRecall}
        onConfirm={onConfirmRecall}
      />

      {/* Hide Message Modal */}
      <HideMessageModal
        isOpen={showHideModal}
        onClose={onCloseHide}
        onConfirm={onConfirmHide}
      />
    </>
  );
};