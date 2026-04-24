import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Khai báo biến toàn cục từ Vite define
declare global {
  const __APP_VERSION__: string;
}

/**
 * UpdateChecker Component
 * Mục đích: 
 * 1. Tự động kiểm tra file version.json trên server mỗi phút.
 * 2. Nếu phát hiện version khác với hiện tại, tự động reload trang (lần 1).
 * 3. Sau khi reload, nếu có flag trong localStorage, hiển thị Popup yêu cầu người dùng reload lần nữa (lần 2).
 */
const UpdateChecker: React.FC = () => {
  const { t } = useTranslation('common');
  const [showModal, setShowModal] = useState(false);
  const STORAGE_KEY = 'app_needs_second_reload';

  useEffect(() => {
    // 1. Kiểm tra xem có đang chờ reload lần 2 không (sau khi hệ thống tự reload lần 1)
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setShowModal(true);
    }

    // 2. Thiết lập polling kiểm tra version mới
    const checkVersion = async () => {
      // Không check trong môi trường development nếu không muốn phiền
      if (import.meta.env.DEV) return;

      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store'
        });
        if (!response.ok) return;
        
        const data = await response.json();
        const serverVersion = data.version;
        const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

        // console.log(`[UpdateChecker] Server: ${serverVersion}, Local: ${currentVersion}`);

        if (serverVersion && currentVersion && serverVersion !== currentVersion && currentVersion !== 'dev') {
          console.log('[UpdateChecker] New version detected! Triggering automatic reload...');
          localStorage.setItem(STORAGE_KEY, 'true');
          // Sử dụng location.reload(true) để force reload từ server (nếu trình duyệt hỗ trợ)
          window.location.reload();
        }
      } catch (error) {
        console.error('[UpdateChecker] Failed to check version:', error);
      }
    };

    // Kiểm tra ngay khi mount và sau mỗi 60 giây
    checkVersion();
    const interval = setInterval(checkVersion, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleReload = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <Modal 
      show={showModal} 
      onHide={() => {}} // Không cho phép đóng bằng phím Esc hoặc click bên ngoài
      backdrop="static" 
      keyboard={false}
      centered
    >
      <Modal.Header className="bg-primary text-white">
        <Modal.Title>
          <i className="bi bi-arrow-repeat me-2"></i>
          {t('update.detected_title')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="py-4 text-center">
        <div className="mb-3">
            <i className="bi bi-cloud-download text-primary" style={{ fontSize: '3rem' }}></i>
        </div>
        <p className="mb-0 fs-5">{t('update.detected_msg')}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleReload} className="w-100 py-2 fw-bold">
          {t('update.reload_button')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateChecker;
