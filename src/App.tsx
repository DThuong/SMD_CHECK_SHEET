import { useEffect } from 'react';
import Routes from './app/Routes'
import { autoTranslateService } from './utils/autoTranslateService';
function App() {
  useEffect(() => {
    // Khởi tạo translation service
    autoTranslateService.init();
  }, []);
  return (
    <>
      <Routes />
    </>
  )
}

export default App
