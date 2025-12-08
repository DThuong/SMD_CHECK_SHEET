import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { Provider } from 'react-redux';
import { store } from './redux/store.ts';

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
     {/** redux provider */}
        <Provider store={store}>
            <ThemeProvider>
                    <App />
            </ThemeProvider>
        </Provider>
    </BrowserRouter>,
)
