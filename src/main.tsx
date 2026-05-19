import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { Provider } from 'react-redux';
import { store, persistor } from './redux/store.ts';
import { PersistGate } from 'redux-persist/integration/react';
import LoadingSpinner from './components/general/LoadingSpinner.tsx';
import '../src/lang/i18n/configs.ts';
import { LanguageProvider } from './contexts/LanguageContext.tsx';

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <BrowserRouter>
            <ThemeProvider>
                <LanguageProvider>
                      <App />
                </LanguageProvider>
            </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
)
