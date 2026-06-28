import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistGate } from 'redux-persist/integration/react'
import App from './App.jsx'
import { BrowserRouter } from "react-router";
import { Provider } from 'react-redux'
import { store, persistor } from './store/index.js'
import { ToastContainer } from 'react-toastify'
import { I18nProvider } from './i18n'
import { LoaderContainer } from './components/loader'
import { setUnauthorizedHandler } from './utils/apiClient'
import { logOut } from './store/actions/authentication'

setUnauthorizedHandler(() => {
    store.dispatch(logOut());
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <Provider store={store}>
            <PersistGate loading={<LoaderContainer />} persistor={persistor}>
                <I18nProvider>
                    <BrowserRouter>
                        <App />
                        <ToastContainer />
                    </BrowserRouter>
                </I18nProvider>
            </PersistGate>
        </Provider>
    </StrictMode>,
)
