import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { signInSuccess } from '../../store/actions/authentication';
import { loginAdministrateur } from '../../services/administrateurs';
import { Loader } from '../../components/loader';
import { toast } from 'react-toastify';
import LogoAssurAssistance from '../../assets/images/logo_assurassistance.png';
import { sendToastError } from '../../helpers';
import { useI18n } from '../../i18n';

export const Login = () => {
    const { t } = useI18n();

    const [formData, setFormData] = useState({
        login: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });

        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: ''
            });
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.login.trim()) {
            errors.login = t('login.loginRequired');
        }
        if (!formData.password) {
            errors.password = t('login.passwordRequired');
        }
        return errors;
    };

    const performLogin = (token, administrateur) => {
        const role = administrateur?.role || 'SUPER_ADMIN';
        dispatch(signInSuccess(token, role, role, administrateur));
        const prenom = administrateur?.prenom || '';
        toast.success(prenom ? t('login.welcomeBack', { prenom }) : t('login.success'), {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
        navigate('/');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitted(true);
        const errors = validateForm();
        setFormErrors(errors);

        if (Object.keys(errors).length > 0) return;

        setLoading(true);
        try {
            const response = await loginAdministrateur(formData.login, formData.password);
            if (response.data?.token) {
                performLogin(response.data.token, response.data.administrateur ?? null);
            } else {
                const msg = response.message || response.error || t('login.invalidCredentials');
                sendToastError(msg);
            }
        } catch (err) {
            sendToastError(err.message || t('login.genericError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="container-xxl px-2 px-sm-3">
                <div className="row vh-100 d-flex justify-content-center align-items-center min-vh-100 py-3">
                    <div className="col-12 col-sm-10 col-md-8 col-lg-5 col-xl-4 mx-auto align-self-center">
                        <div className="card-body p-0">
                            <div className="row justify-content-center">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-body p-0 auth-header-box rounded-top">
                                            <div className="text-center p-3">
                                                <a href="#" className="logo logo-admin">
                                                    <img
                                                        src={LogoAssurAssistance}
                                                        height={100}
                                                        alt="logo"
                                                        className="auth-logo"
                                                    />
                                                </a>
                                                {/* <h4 className="mt-3 mb-1 fw-semibold fs-18">
                                                    {t('common.appName')}
                                                </h4> */}
                                                <p className="text-muted fw-medium mb-0 mt-3">
                                                    {t('login.subtitle')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0">
                                            <form className="my-4" onSubmit={handleSubmit}>
                                                <div className="form-group mb-2">
                                                    <label className="form-label" htmlFor="login">
                                                        Login
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${submitted && formErrors.login ? 'is-invalid' : ''}`}
                                                        id="login"
                                                        name="login"
                                                        placeholder={t('login.loginPlaceholder')}
                                                        value={formData.login}
                                                        onChange={handleChange}
                                                    />
                                                    {submitted && formErrors.login && (
                                                        <div className="invalid-feedback" style={{ fontSize: '0.8rem' }}>{formErrors.login}</div>
                                                    )}
                                                </div>
                                                {/*end form-group*/}
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="userpassword">
                                                        {t('login.password')}
                                                    </label>
                                                    <input
                                                        type="password"
                                                        className={`form-control ${submitted && formErrors.password ? 'is-invalid' : ''}`}
                                                        name="password"
                                                        id="userpassword"
                                                        placeholder={t('login.passwordPlaceholder')}
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                    />
                                                    {submitted && formErrors.password && (
                                                        <div className="invalid-feedback" style={{ fontSize: '0.8rem' }}>{formErrors.password}</div>
                                                    )}
                                                </div>

                                                {/*end form-group*/}
                                                <div className="form-group mb-0 row">
                                                    <div className="col-12">
                                                        <div className="d-grid mt-3">
                                                            {
                                                                loading ?
                                                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                                        <Loader />
                                                                    </div>
                                                                    :
                                                                    <button className="btn" style={{ backgroundColor: '#e4590f', borderColor: '#e4590f' }} type="submit">
                                                                        {t('login.submit')} <i className="fas fa-sign-in-alt ms-1" />
                                                                    </button>
                                                            }
                                                        </div>
                                                    </div>
                                                    {/*end col*/}
                                                </div>{" "}
                                                {/*end form-group*/}
                                            </form>
                                            {/*end form*/}
                                        </div>
                                        {/*end card-body*/}
                                    </div>
                                    {/*end card*/}
                                </div>
                                {/*end col*/}
                            </div>
                            {/*end row*/}
                        </div>
                        {/*end card-body*/}
                    </div>
                    {/*end col*/}
                </div>
                {/*end row*/}
            </div>
            {/* container */}
        </>
    )
}
