import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from "react-router";
import { Provider } from 'react-redux'
import { store } from './store/index.js'
import { ToastContainer } from 'react-toastify'
import { I18nProvider } from './i18n'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <I18nProvider>
                <BrowserRouter>
                    <App />
                    <ToastContainer />
                </BrowserRouter>
            </I18nProvider>
        </Provider>
    </StrictMode>,
)
