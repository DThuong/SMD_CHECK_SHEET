import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Khai báo biến toàn cục từ Vite define
declare global {
  const __APP_VERSION__: string;
}

const isDev = import.meta.env.DEV;

/**
 * UpdateChecker Component
 * Luồng hoạt động:
 * 1. Check version ngay khi mount, mỗi 60s (interval), và khi user quay lại tab (visibilitychange).
 * 2. Nếu server down (Docker restart), tự động retry sau 10s.
 * 3. Nếu phát hiện version khác → lưu flag → tự động reload (lần 1).
 * 4. Sau reload, nếu có flag trong localStorage → hiển thị popup yêu cầu reload lần 2.
 *
 * Performance note: Chỉ fetch 1 file JSON ~30 bytes mỗi 60s → không ảnh hưởng performance.
 */
const UpdateChecker: React.FC = () => {
  const { t } = useTranslation('common');
  const [showModal, setShowModal] = useState(false);
  const STORAGE_KEY = 'app_needs_second_reload';

  useEffect(() => {
    // Hiển thị popup nếu vừa reload lần 1 xong
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      setShowModal(true);
    }

    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const checkVersion = async () => {
      if (isDev) return;

      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });

        if (!response.ok) {
          retryTimeout = setTimeout(checkVersion, 10000);
          return;
        }

        const data = await response.json();
        const serverVersion: string = data.version;
        const localVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'undefined';

        if (!serverVersion || !localVersion || localVersion === 'undefined' || localVersion === 'dev') return;

        if (serverVersion !== localVersion) {
          localStorage.setItem(STORAGE_KEY, 'true');
          window.location.reload();
        }
      } catch {
        // Retry sau 10s nếu server đang restart (Docker rebuild)
        retryTimeout = setTimeout(checkVersion, 10000);
      }
    };

    // Kiểm tra ngay khi user quay lại tab (phát hiện version mới nhanh hơn)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (retryTimeout) { clearTimeout(retryTimeout); retryTimeout = null; }
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check ngay lập tức + interval 60s
    checkVersion();
    const interval = setInterval(checkVersion, 60000);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const handleReload = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  return (
    <Modal
      show={showModal}
      onHide={() => {}}
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
