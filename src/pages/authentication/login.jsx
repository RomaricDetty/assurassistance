import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { SIGNIN_URL, VERIFY_2FA_URL } from '../../config/urls/authentication';
import { signInSuccess } from '../../store/actions/authentication';
import { Loader } from '../../components/loader';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import LogoAssurAssistance from '../../assets/images/logo_assurassistance.png'
import { sendToastError } from '../../helpers';

export const Login = () => {

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [loading2FA, setLoading2FA] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [tempToken, setTempToken] = useState(null);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);

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

        // Email validation
        if (!formData.email.trim()) {
            errors.email = "L'email est requis";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = "Format d'email invalide";
        }

        // Password validation
        if (!formData.password) {
            errors.password = "Le mot de passe est requis";
        }
        return errors;
    };

    const performLogin = (token) => {
        const decoded = jwtDecode(token);
        localStorage.setItem("token", token);
        localStorage.setItem("role", decoded.partnerData?.role?.type);
        localStorage.setItem("accounttype", decoded.partnerData?.role?.type);
        dispatch(signInSuccess(token, decoded.partnerData?.role?.type, decoded.partnerData?.role?.type));
        toast.success(`Bon retour parmi nous! ${decoded.partnerData?.firstname}`, {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
        navigate('/');
    };

    const handleSubmit = (e) => {
        
        e.preventDefault();


        navigate('/test');
        return;


        setSubmitted(true);

        const errors = validateForm();
        setFormErrors(errors);

        if (Object.keys(errors).length === 0) {
            setLoading(true);

            fetch(SIGNIN_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    auth_scope: 'web'
                })
            })
                .then(response => response.json())
                .then(response => {
                    setLoading(false);
                    if (response.success) {
                        if (response.requires_2fa) {
                            setTempToken(response.temp_token);
                            setShow2FAModal(true);
                            setOtpInputs(['', '', '', '', '', '']);
                        } else {
                            performLogin(response.data.token);
                        }
                    } else {
                        const errorMessage = response.message;
                        toast.error(errorMessage, {
                            position: "top-right",
                            autoClose: 3000,
                            hideProgressBar: false,
                            closeOnClick: true,
                            pauseOnHover: true,
                            draggable: true
                        });
                    }
                })
                .catch(() => {
                    setLoading(false);
                    toast.error('Une erreur est survenue', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true
                    });
                });
        }
    };

    const handleOtpInputChange = (index, value) => {
        if (value && !/^\d$/.test(value)) {
            return;
        }

        const newInputs = [...otpInputs];
        newInputs[index] = value;
        setOtpInputs(newInputs);

        if (value && index < 5) {
            const nextInput = document.getElementById(`login-otp-input-${index + 1}`);
            if (nextInput) {
                nextInput.focus();
            }
        }

        const fullCode = newInputs.join('');
        if (fullCode.length === 6) {
            setTimeout(() => {
                handleVerify2FA(fullCode);
            }, 100);
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
            const prevInput = document.getElementById(`login-otp-input-${index - 1}`);
            if (prevInput) {
                prevInput.focus();
            }
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setOtpInputs(digits);
            const lastInput = document.getElementById('login-otp-input-5');
            if (lastInput) {
                lastInput.focus();
            }
            setTimeout(() => {
                handleVerify2FA(pastedData);
            }, 100);
        }
    };

    const handleVerify2FA = async (totpCode) => {
        if (!totpCode || totpCode.length !== 6) {
            sendToastError('Veuillez saisir un code à 6 chiffres');
            return;
        }
        try {
            setLoading2FA(true);
            const response = await fetch(VERIFY_2FA_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    temp_token: tempToken,
                    totp_code: totpCode,
                    backup_code: ''
                })
            });
            const result = await response.json();
            if (result.success) {
                performLogin(result.data.token);
                setShow2FAModal(false);
                setOtpInputs(['', '', '', '', '', '']);
                setTempToken(null);
            } else {
                sendToastError(result.message || 'Code 2FA invalide');
                setOtpInputs(['', '', '', '', '', '']);
                const firstInput = document.getElementById('login-otp-input-0');
                if (firstInput) {
                    firstInput.focus();
                }
            }
            setLoading2FA(false);
        } catch (error) {
            console.error('Erreur lors de la vérification de la 2FA:', error);
            sendToastError(error.message || 'Erreur lors de la vérification de la 2FA');
            setLoading2FA(false);
            setOtpInputs(['', '', '', '', '', '']);
        }
    };

    const handleClose2FAModal = () => {
        setShow2FAModal(false);
        setOtpInputs(['', '', '', '', '', '']);
        setTempToken(null);
    };

    return (
        <>
            <div className="container-xxl">
                <div className="row vh-100 d-flex justify-content-center">
                    <div className="col-12 align-self-center">
                        <div className="card-body">
                            <div className="row">
                                <div className="col-lg-4 mx-auto">
                                    <div className="card">
                                        <div className="card-body p-0 auth-header-box rounded-top">
                                            <div className="text-center p-3">
                                                <a href="#" className="logo logo-admin">
                                                    <img
                                                        src={LogoAssurAssistance}
                                                        height={80}
                                                        alt="logo"
                                                        className="auth-logo"
                                                    />
                                                </a>
                                                <h4 className="mt-3 mb-1 fw-semibold fs-18">
                                                    Assur'Assistance
                                                </h4>
                                                <p className="text-muted fw-medium mb-0">
                                                    Se connecter pour continuer.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0">
                                            <form className="my-4" onSubmit={handleSubmit}>
                                                <div className="form-group mb-2">
                                                    <label className="form-label" htmlFor="username">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className={`form-control ${submitted && formErrors.email ? 'is-invalid' : ''}`}
                                                        id="email"
                                                        name="email"
                                                        placeholder="Entrer l'email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                    />
                                                    {submitted && formErrors.email && (
                                                        <div className="invalid-feedback" style={{ fontSize: '0.8rem' }}>{formErrors.email}</div>
                                                    )}
                                                </div>
                                                {/*end form-group*/}
                                                <div className="form-group">
                                                    <label className="form-label" htmlFor="userpassword">
                                                        Mot de passe
                                                    </label>
                                                    <input
                                                        type="password"
                                                        className={`form-control ${submitted && formErrors.password ? 'is-invalid' : ''}`}
                                                        name="password"
                                                        id="userpassword"
                                                        placeholder="Entrer le mot de passe"
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
                                                                    <button className="btn btn-primary" style={{ backgroundColor: '#e4590f', borderColor: '#e4590f' }} type="submit">
                                                                        Se connecter <i className="fas fa-sign-in-alt ms-1" />
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

            {/* Modal 2FA */}
            {show2FAModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title">
                                    <i className="iconoir-lock me-2"></i>
                                    Authentification à deux facteurs
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={handleClose2FAModal}
                                    disabled={loading2FA}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info mb-4">
                                    <i className="iconoir-info-circle me-2"></i>
                                    <strong>Code requis :</strong> Saisissez le code à 6 chiffres affiché dans votre application d'authentification (Google Authenticator, Authy, etc.)
                                </div>

                                <div className="text-center mb-4">
                                    <label className="form-label fw-semibold mb-3">Code de vérification</label>
                                    <div className="d-flex justify-content-center gap-2" onPaste={handleOtpPaste}>
                                        {otpInputs.map((value, index) => (
                                            <input
                                                key={index}
                                                id={`login-otp-input-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength="1"
                                                className="form-control text-center"
                                                style={{
                                                    width: '50px',
                                                    height: '60px',
                                                    fontSize: '24px',
                                                    fontWeight: 'bold',
                                                    border: '2px solid #dee2e6',
                                                    borderRadius: '8px'
                                                }}
                                                value={value}
                                                onChange={(e) => handleOtpInputChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                autoFocus={index === 0}
                                                disabled={loading2FA}
                                            />
                                        ))}
                                    </div>
                                    {loading2FA && (
                                        <div className="mt-3">
                                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                <span className="visually-hidden">Vérification en cours...</span>
                                            </div>
                                            <span className="ms-2 text-muted">Vérification en cours...</span>
                                        </div>
                                    )}
                                </div>

                                <div className="alert alert-warning mb-0">
                                    <i className="iconoir-warning-triangle me-2"></i>
                                    Assurez-vous que l'heure de votre appareil est correctement synchronisée pour que le code fonctionne.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleClose2FAModal}
                                    disabled={loading2FA}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => handleVerify2FA(otpInputs.join(''))}
                                    disabled={loading2FA || otpInputs.join('').length !== 6}
                                >
                                    {loading2FA ? 'Vérification...' : 'Vérifier'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
