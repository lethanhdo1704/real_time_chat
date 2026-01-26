// frontend/src/utils/handleBanned.js
export function handleBanned(banData = {}) {
  // 1. Clear auth tokens
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem('friend-storage');
  
  // 2. Build message
  let message = "Tài khoản của bạn đã bị cấm";
  
  if (banData.isPermanent) {
    message = "Tài khoản của bạn đã bị cấm vĩnh viễn";
  } else if (banData.banEndAt) {
    const date = new Date(banData.banEndAt);
    if (!isNaN(date.getTime())) {
      const formattedDate = date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      message = `Tài khoản của bạn bị cấm đến ${formattedDate}`;
    }
  }
  
  // 3. Store message in session storage
  sessionStorage.setItem('banMessage', message);
  
  // 4. Redirect to login
  window.location.href = "/login?banned=1";
}