import React, { useState, useEffect } from 'react'
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import { validateAndCleanImageUrl } from '../../utils';
import { getPartnerDetails, updatePartnerDetails, updatePartnerPassword } from '../../config/urls/partners';
import { ENABLE_2FA_URL, VERIFY_2FA_SETUP_URL } from '../../config/urls/authentication';
import { sendToastError, sendToastSuccess } from '../../helpers';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { Loader } from '../../components/loader';
import Avatar from '../../assets/images/avatar.png';

export const Profile = () => {

    const token = useSelector(state => state.auth.token)
    const [partner, setPartner] = useState(null)
    const [loading, setLoading] = useState(true)
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({});
    const [showPasswords, setShowPasswords] = useState({
        current_password: false,
        new_password: false,
        confirm_password: false
    });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        name: '',
        phone: '',
        address: '',
        city: '',
        country: ''
    });
    const [pendingChanges, setPendingChanges] = useState({});
    const [loading2FA, setLoading2FA] = useState(false);
    const [show2FAModal, setShow2FAModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [backupCodes, setBackupCodes] = useState([]);
    const [current2FAStep, setCurrent2FAStep] = useState(1);
    const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
    const [show2FAInfoModal, setShow2FAInfoModal] = useState(false);

    const fetchPartnerDetails = async () => {
        const decodedToken = jwtDecode(token);
        const id = decodedToken.partnerData?.id;
        try {
            setLoading(true);
            const response = await fetch(`${getPartnerDetails}/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                setPartner(result.data);
            } else {
                setLoading(false);
                sendToastError('Erreur lors de la récupération des détails du partenaire');
            }
        } catch (error) {
            console.error('Erreur:', error);
            sendToastError('Erreur lors de la récupération des détails du partenaire');
        } finally {
            setLoading(false);
        }
    }

    const getAccountTypeBadge = (roleName) => {
        if (roleName === 'admin') {
            return <span className="badge rounded text-purple bg-purple-subtle">Administrateur</span>
        } else if (roleName === 'partner') {
            return <span className="badge rounded text-success bg-success-subtle">Partenaire</span>
        } else if (roleName === 'merchant') {
            return <span className="badge rounded text-primary bg-primary-subtle">Marchand</span>
        }
        return <span className="badge rounded text-secondary bg-secondary-subtle">{roleName}</span>
    }

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!hasChanges || Object.keys(pendingChanges).length === 0) {
            sendToastError('Aucune modification détectée');
            return;
        }
        setShowConfirmModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (partner && partner[name] !== value) {
            setPendingChanges(prev => ({
                ...prev,
                [name]: {
                    old: partner[name],
                    new: value
                }
            }));
            setHasChanges(true);
        } else {
            setPendingChanges(prev => {
                const newChanges = { ...prev };
                delete newChanges[name];
                return newChanges;
            });
            setHasChanges(Object.keys(pendingChanges).length > 1);
        }
    };

    const handleCancel = () => {
        setFormData({
            firstname: partner?.firstname || '',
            lastname: partner?.lastname || '',
            name: partner?.name || '',
            phone: partner?.phone || '',
            address: partner?.address || '',
            city: partner?.city || '',
            country: partner?.country || ''
        });

        setPendingChanges({});
        setHasChanges(false);
    };

    useEffect(() => {
        fetchPartnerDetails();
    }, []);


    const handlePasswordFormSubmit = (e) => {
        e.preventDefault();

        if (validatePasswordForm()) {
            setShowPasswordModal(true);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));

        if (passwordErrors[name]) {
            setPasswordErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validatePasswordForm = () => {
        const errors = {};

        if (!passwordData.current_password) {
            errors.current_password = 'Le mot de passe actuel est requis';
        }

        if (!passwordData.new_password) {
            errors.new_password = 'Le nouveau mot de passe est requis';
        } else if (passwordData.new_password.length < 8) {
            errors.new_password = 'Le mot de passe doit contenir au moins 8 caractères';
        }

        if (!passwordData.confirm_password) {
            errors.confirm_password = 'Veuillez confirmer le mot de passe';
        } else if (passwordData.new_password !== passwordData.confirm_password) {
            errors.confirm_password = 'Les mots de passe ne correspondent pas';
        }

        if (passwordData.current_password === passwordData.new_password) {
            errors.new_password = 'Le nouveau mot de passe doit être différent de l\'ancien';
        }

        setPasswordErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCancelPasswordForm = () => {
        setPasswordData({
            current_password: '',
            new_password: '',
            confirm_password: ''
        });
        setPasswordErrors({});
        setShowPasswords({
            current_password: false,
            new_password: false,
            confirm_password: false
        });
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmitUpdate = async () => {
        try {
            const cleanedFormData = Object.entries(formData).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    acc[key] = value;
                }
                return acc;
            }, {});
            const response = await fetch(`${updatePartnerDetails}/${partner.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cleanedFormData)
            });

            const result = await response.json();
            if (result.success) {
                sendToastSuccess('Informations mise à jour avec succès');
                handleCancel();
                fetchPartnerDetails();
            }
            else {
                sendToastError('Erreur lors de la mise à jour des informations du partenaire');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            sendToastError('Erreur lors de la mise à jour des informations du partenaire');
        }
    };

    const handleConfirmUpdate = async () => {
        setShowConfirmModal(false);
        await handleSubmitUpdate();
    };

    const handleCancelModal = () => {
        setShowConfirmModal(false);
    };

    const getFieldLabel = (fieldName) => {
        const labels = {
            firstname: 'Prénom du représentant',
            lastname: 'Nom du représentant',
            name: "Nom de l'entreprise",
            phone: 'Téléphone de contact',
            address: 'Adresse',
            city: 'Ville',
            country: 'Pays'
        };
        return labels[fieldName] || fieldName;
    };

    const handleConfirmPasswordChange = async () => {
        setShowPasswordModal(false);
        await handleUpdatePassword();
    };

    const handleUpdatePassword = async () => {
        try {
            const response = await fetch(`${updatePartnerPassword}/${partner.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password
                })
            });

            const result = await response.json();

            if (result.success) {
                sendToastSuccess('Mot de passe modifié avec succès');
                setPasswordData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                });
                setPasswordErrors({});
                setShowPasswords({
                    current_password: false,
                    new_password: false,
                    confirm_password: false
                });
            } else {
                sendToastError(result.message || 'Erreur lors de la modification du mot de passe');
            }
        } catch (error) {
            console.error('Erreur lors de la mise à jour du mot de passe:', error);
            sendToastError('Erreur lors de la modification du mot de passe');
        }
    };

    const handleCancelPasswordModal = () => {
        setShowPasswordModal(false);
    };

    const handleEnable2FA = async () => {
        try {
            setLoading2FA(true);
            const response = await fetch(ENABLE_2FA_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (result.success) {
                setQrCodeUrl(result.qr_code_url);
                setBackupCodes(result.backup_codes || []);
                setCurrent2FAStep(1);
                setShow2FAModal(true);
                setLoading2FA(false);
                sendToastSuccess('2FA activé avec succès');
            } else {
                setLoading2FA(false);
                sendToastError(result.message || 'Erreur lors de l\'activation de la 2FA');
            }
        } catch (error) {
            console.error('Erreur lors de l\'activation de la 2FA:', error);
            sendToastError('Erreur lors de l\'activation de la 2FA');
            setLoading2FA(false);
        }
    };

    const handleCancel2FAModal = () => {
        setShow2FAModal(false);
        setCurrent2FAStep(1);
        setQrCodeUrl(null);
        setBackupCodes([]);
        setOtpInputs(['', '', '', '', '', '']);
    };

    const handleOpen2FAInfoModal = () => {
        setShow2FAInfoModal(true);
    };

    const handleClose2FAInfoModal = () => {
        setShow2FAInfoModal(false);
    };

    const handleNext2FAStep = () => {
        setCurrent2FAStep(2);
    };

    const handleVerify2FAStep = async (otpCode) => {
        if (otpCode.length !== 6) {
            sendToastError('Veuillez saisir un code à 6 chiffres');
            return;
        }
        
        try {
            setLoading2FA(true);
            const response = await fetch(VERIFY_2FA_SETUP_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    totp_code: otpCode
                })
            });
            const result = await response.json();
            if (result.success) {
                sendToastSuccess('2FA activé avec succès');
                handleCancel2FAModal();
                fetchPartnerDetails();
            } else {
                sendToastError(result.message || 'Erreur lors de la vérification de la 2FA');
                setOtpInputs(['', '', '', '', '', '']);
            }
            setLoading2FA(false);
        } catch (error) {
            console.error('Erreur lors de la vérification de la 2FA:', error);
            sendToastError('Erreur lors de la vérification de la 2FA');
            setLoading2FA(false);
            setOtpInputs(['', '', '', '', '', '']);
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
            const nextInput = document.getElementById(`otp-input-${index + 1}`);
            if (nextInput) {
                nextInput.focus();
            }
        }

        const fullCode = newInputs.join('');
        if (fullCode.length === 6) {
            setTimeout(() => {
                handleVerify2FAStep(fullCode);
            }, 100);
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
            const prevInput = document.getElementById(`otp-input-${index - 1}`);
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
            const lastInput = document.getElementById('otp-input-5');
            if (lastInput) {
                lastInput.focus();
            }
            setTimeout(() => {
                handleVerify2FAStep(pastedData);
            }, 100);
        }
    };

    if (loading) {
        return <Layout>
            <div className="page-content">
                <div className="h-100 w-100 d-flex justify-content-center align-items-center">
                    <Loader />
                </div>
            </div>
        </Layout>
    }

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                                <div className="">
                                    <ol className="breadcrumb mb-0">
                                        <li className="breadcrumb-item">
                                            <Link to="/partners">Partenaires</Link>
                                        </li>
                                        <li className="breadcrumb-item">
                                            <a href="#">Détails</a>
                                        </li>
                                        {/*end nav-item*/}
                                        <li className="breadcrumb-item active">{partner?.name}</li>
                                    </ol>
                                </div>
                            </div>
                            {/*end page-title-box*/}
                        </div>
                        {/*end col*/}
                    </div>
                    {/*end row*/}
                    <div className="row justify-content-center">
                        <div className="row col-md-12 mb-3">
                            <div className="col-md-5 card h-100">
                                <div className="card-body p-4  rounded text-center img-bg"></div>
                                {/*end card-body*/}
                                <div className="position-relative">
                                    <div className="shape overflow-hidden text-card-bg">
                                        <svg
                                            viewBox="0 0 2880 48"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M0 48H1437.5H2880V0H2160C1442.5 52 720 0 720 0H0V48Z"
                                                fill="currentColor"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <div className="card-body mt-n6">
                                    <div className="row align-items-center">
                                        <div className="col">
                                            <div className="d-flex flex-column align-items-center text-center">
                                                <div className="position-relative mb-3">
                                                    <img
                                                        src={validateAndCleanImageUrl(partner?.logo, Avatar)}
                                                        alt=""
                                                        className=""
                                                        style={{ width: '100px', height: '100px', borderRadius: '50px' }}
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <h5 className="m-0 fs-3 fw-bold">{partner?.name || 'N/A'}</h5>
                                                    <p className="text-muted mb-0">@{partner?.role?.name || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/*end row*/}
                                    <div className="row align-items-center">
                                        <div className="col-lg-12">
                                            <div className="mt-3">
                                                <div className="text-body mb-2 d-flex align-items-center">
                                                    <i className="iconoir-language fs-20 me-1 text-muted" />
                                                    <span className="text-body fw-semibold">
                                                        Pays :
                                                    </span>{" "}
                                                    <span className='ms-1'>{partner?.country || 'N/A'}</span>
                                                </div>
                                                <div className="text-muted mb-2 d-flex align-items-center">
                                                    <i className="iconoir-mail-out fs-20 me-1" />
                                                    <span className="text-body fw-semibold">Email :</span>
                                                    <a
                                                        href={`mailto:${partner?.email}`}
                                                        className="text-primary text-decoration-underline ms-1"
                                                    >
                                                        {partner?.email || 'N/A'}
                                                    </a>
                                                </div>
                                                <div className="text-body mb-3 d-flex align-items-center">
                                                    <i className="iconoir-phone fs-20 me-1 text-muted" />
                                                    <span className="text-body fw-semibold">Téléphone : </span> <span className='ms-1'>{partner?.phone || 'N/A'}</span>
                                                </div>
                                                {/* <button
                                                    type="button"
                                                    className={`btn ${partner?.active ? 'btn-danger' : 'btn-success'} d-inline-block`}
                                                >
                                                    {partner?.active ? 'Bloquer' : 'Débloquer'}
                                                </button> */}
                                            </div>
                                        </div>
                                        {/*end col*/}
                                    </div>
                                    {/*end row*/}
                                </div>
                                {/*end card-body*/}
                            </div>
                            <div className="col-md-7 h-100">
                                <div className="card h-100">
                                    <div className="card-body d-flex flex-column justify-content-center">
                                        <h5 className="fw-bold mb-2" style={{ color: '#2a2f4f' }}>
                                            À propos d'OrionPay
                                        </h5>
                                        <p className="mb-0" style={{ fontSize: '15px', color: '#555' }}>
                                            <b>OrionPay</b> est une plateforme moderne de gestion des paiements et de transactions, conçue pour répondre aux besoins des partenaires, marchands, et administrateurs. 
                                            <br />
                                            Notre objectif est de rendre les paiements électroniques plus simples, plus sûrs et accessibles à tous. Avec OrionPay, gérez facilement vos comptes, suivez vos transactions, 
                                            et bénéficiez de fonctionnalités avancées telles que l'authentification à deux facteurs pour une sécurité renforcée.
                                            <br />
                                            Rejoignez une communauté innovante qui place la fiabilité, la rapidité et la transparence au cœur de ses valeurs.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/*end card*/}
                            {/*end card*/}
                        </div>{" "}
                        {/*end col*/}
                        <div className="col-md-12">
                            <ul className="nav nav-tabs mb-3" role="tablist">
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium active"
                                        data-bs-toggle="tab"
                                        href="#post"
                                        role="tab"
                                        aria-selected="true"
                                    >
                                        Informations générales
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium"
                                        data-bs-toggle="tab"
                                        href="#settings"
                                        role="tab"
                                        aria-selected="false"
                                    >
                                        Paramètres
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium"
                                        data-bs-toggle="tab"
                                        href="#security"
                                        role="tab"
                                        aria-selected="false"
                                    >
                                        Sécurité
                                    </a>
                                </li>

                            </ul>
                            {/* Tab panes */}
                            <div className="tab-content">
                                {/* Section Informations générales */}
                                <div className="tab-pane active" id="post" role="tabpanel">
                                    <div className="row">
                                        {partner.fees.length > 0 && <>
                                            <div className="col-lg-6">
                                                <div className="card">
                                                    <div className="card-body">
                                                        <div className="row d-flex justify-content-center">
                                                            <div className="col">
                                                                <p className="text-dark mb-1 fw-semibold">Frais Payin</p>
                                                                <h3 className="my-2 fs-24 fw-bold">
                                                                    {partner?.fees?.find(fee => fee.transaction_type.id === 1)?.value || 0} {partner?.fees?.find(fee => fee.transaction_type.id === 1)?.type === 'percentage' ? '%' : 'FCFA'}
                                                                </h3>
                                                            </div>
                                                            <div className="col-auto align-self-center">
                                                                <div className="d-flex justify-content-center align-items-center thumb-xl bg-light rounded-circle mx-auto">
                                                                    <i className="iconoir-arrow-down-left fs-30 align-self-center text-muted" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="card">
                                                    <div className="card-body">
                                                        <div className="row d-flex justify-content-center">
                                                            <div className="col">
                                                                <p className="text-dark mb-1 fw-semibold">Frais Payout</p>
                                                                <h3 className="my-2 fs-24 fw-bold">
                                                                    {partner?.fees?.find(fee => fee.transaction_type.id === 2)?.value || 0} {partner?.fees?.find(fee => fee.transaction_type.id === 2)?.type === 'percentage' ? '%' : 'FCFA'}
                                                                </h3>
                                                            </div>
                                                            <div className="col-auto align-self-center">
                                                                <div className="d-flex justify-content-center align-items-center thumb-xl bg-light rounded-circle mx-auto">
                                                                    <i className="iconoir-arrow-up-right fs-30 align-self-center text-muted" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                        </>}
                                    </div>
                                    {/*end row*/}
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="card">
                                                <div className="card-header">
                                                    <div className="row align-items-center">
                                                        <div className="col">
                                                            <h4 className="card-title">Informations générales</h4>
                                                        </div>
                                                        {/*end col*/}
                                                        {/* <div className="col-auto">
                                            <a
                                                href="#"
                                                className="float-end text-muted d-inline-flex text-decoration-underline"
                                            >
                                                <i className="iconoir-edit-pencil fs-18 me-1" />
                                                Modifier
                                            </a>
                                        </div> */}
                                                        {/*end col*/}
                                                    </div>{" "}
                                                    {/*end row*/}
                                                </div>
                                                {/*end card-header*/}
                                                <div className="card-body pt-0">
                                                    <p className="text-muted fw-medium mb-3">
                                                        {partner?.name}
                                                    </p>

                                                    <ul className="list-unstyled mb-0">
                                                        <li className="">
                                                            <i className="las la-birthday-cake me-2 text-secondary fs-22 align-middle" />{" "}
                                                            <b> Date de création </b> : {new Date(partner?.created_at).toLocaleDateString('fr-FR', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </li>
                                                        <li className="mt-2">
                                                            <i className="las la-briefcase me-2 text-secondary fs-22 align-middle" />{" "}
                                                            <b> Type de compte </b> : {getAccountTypeBadge(partner?.role?.name)}
                                                        </li>
                                                        <li className="mt-2">
                                                            <i className="las la-map-marker me-2 text-secondary fs-22 align-middle" />{" "}
                                                            <b> Adresse </b> : {partner?.address || 'N/A'}
                                                        </li>
                                                        <li className="mt-2">
                                                            <i className="las la-city me-2 text-secondary fs-22 align-middle" />{" "}
                                                            <b> Ville </b> : {partner?.city || 'N/A'}
                                                        </li>
                                                        <li className="mt-2">
                                                            <i className="las la-phone me-2 text-secondary fs-22 align-middle" />{" "}
                                                            <b> Téléphone </b> : {partner?.phone || 'N/A'}
                                                        </li>
                                                        <li className="mt-2">
                                                            <i className="las la-envelope text-secondary fs-22 align-middle me-2" />{" "}
                                                            <b> Email </b> : {partner?.email || 'N/A'}
                                                        </li>
                                                        <li className="mt-2">
                                                            <i className="las la-flag text-secondary fs-22 align-middle me-2" />{" "}
                                                            <b> Statut </b> :
                                                            <span className={`badge ms-2 ${partner?.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                                {partner?.active ? 'Actif' : 'Inactif'}
                                                            </span>
                                                        </li>
                                                    </ul>
                                                </div>
                                                {/*end card-body*/}
                                            </div>
                                        </div>
                                        <div className="col-12">
                                            <div className="card">
                                                <div className="card-header">
                                                    <div className="row align-items-center">
                                                        <div className="col">
                                                            <h4 className="card-title">Commissions</h4>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="card-body pt-0">
                                                    {partner?.commissions && partner.commissions.length > 0 ? (
                                                        <div className="table-responsive">
                                                            <table className="table table-hover mb-0">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th>Partenaire commissionné</th>
                                                                        <th>Type de transaction</th>
                                                                        <th>Frais du marchand</th>
                                                                        <th>Valeur</th>
                                                                        <th>Type de commission</th>
                                                                        <th>Statut</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {partner.commissions.map((commission) => (
                                                                        <tr key={commission.id}>
                                                                            <td>
                                                                                <div className="d-flex flex-column">
                                                                                    <span className="fw-semibold">{commission.fee?.partner?.name || 'N/A'}</span>
                                                                                    <small className="text-muted">{commission.fee?.partner?.email || ''}</small>
                                                                                </div>
                                                                            </td>
                                                                            <td>
                                                                                <span className={`badge ${commission.fee?.transaction_type?.name === 'PAYIN' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info'}`}>
                                                                                    <i className={`iconoir-${commission.fee?.transaction_type?.name === 'PAYIN' ? 'arrow-down-left' : 'arrow-up-right'} me-1`}></i>
                                                                                    {commission.fee?.transaction_type?.name || 'N/A'}
                                                                                </span>
                                                                            </td>
                                                                            <td>
                                                                                <span className="fw-medium">
                                                                                    {commission.fee?.value || 0}
                                                                                    {commission.fee?.type === 'percentage' ? '%' : ' FCFA'}
                                                                                </span>
                                                                                <br />
                                                                                <small className="text-muted">{commission.fee?.code || ''}</small>
                                                                            </td>
                                                                            <td>
                                                                                <span className="fw-bold text-success">
                                                                                    {commission.value || 0}
                                                                                    {commission.fee?.type === 'percentage' ? '%' : ' FCFA'}
                                                                                </span>
                                                                            </td>
                                                                            <td>
                                                                                <span className={`badge ${commission.fee?.type === 'percentage' ? 'bg-warning-subtle text-warning' : 'bg-secondary-subtle text-secondary'}`}>
                                                                                    <i className={`iconoir-${commission.fee?.type === 'percentage' ? 'percentage' : 'dollar'} me-1`}></i>
                                                                                    {commission.fee?.type === 'percentage' ? 'Pourcentage' : 'Fixe'}
                                                                                </span>
                                                                            </td>
                                                                            <td>
                                                                                <span className={`badge ${commission.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                                                    {commission.active ? 'Actif' : 'Inactif'}
                                                                                </span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4">
                                                            <i className="iconoir-warning-triangle fs-48 text-muted mb-3 d-block"></i>
                                                            <p className="text-muted">Aucune commission configurée pour ce partenaire</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/*end row*/}
                                </div>
                                {/* Section Paramètres */}
                                <div className="tab-pane p-3" id="settings" role="tabpanel">
                                    <div className="card">
                                        <div className="card-header">
                                            <div className="row align-items-center">
                                                <div className="col">
                                                    <h4 className="card-title">Informations personnelles</h4>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0">
                                            <form onSubmit={handleFormSubmit}>
                                                {/* Prénom */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Prénom du représentant
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            defaultValue={partner?.firstname || ''}
                                                            name="firstname"
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Nom */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Nom du représentant
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            defaultValue={partner?.lastname || ''}
                                                            name="lastname"
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Nom de l'entreprise */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Nom de l'entreprise
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            defaultValue={partner?.name || ''}
                                                            name="name"
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Téléphone de contact */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Téléphone de contact
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <div className="input-group">
                                                            <span className="input-group-text">
                                                                <i className="las la-phone" />
                                                            </span>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                defaultValue={partner?.phone || ''}
                                                                placeholder="Téléphone"
                                                                name="phone"
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Adresse email - Non modifiable */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Adresse email
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <div className="input-group">
                                                            <span className="input-group-text">
                                                                <i className="las la-at" />
                                                            </span>
                                                            <input
                                                                type="email"
                                                                className="form-control"
                                                                defaultValue={partner?.email || ''}
                                                                placeholder="Email"
                                                                name="email"
                                                                disabled
                                                                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                                                onChange={handleInputChange}
                                                            />
                                                        </div>
                                                        <span className="form-text text-muted font-12">
                                                            L'email ne peut pas être modifié
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Adresse */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Adresse
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            defaultValue={partner?.address || ''}
                                                            placeholder="Adresse complète"
                                                            name="address"
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Ville */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Ville
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <input
                                                            className="form-control"
                                                            type="text"
                                                            defaultValue={partner?.city || ''}
                                                            placeholder="Ville"
                                                            name="city"
                                                            onChange={handleInputChange}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Pays */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Pays
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <select className="form-select" name="country" defaultValue={partner?.country || ''} onChange={handleInputChange}>
                                                            <option value="">Sélectionner un pays</option>
                                                            <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Boutons */}
                                                <div className="form-group row">
                                                    <div className="col-lg-9 col-xl-8 offset-lg-3">
                                                        <button type="submit" className="btn btn-primary" >
                                                            Enregistrer
                                                        </button>
                                                        <button type="button" className="btn btn-danger ms-2" onClick={handleCancel}>
                                                            Annuler
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                            {/* Modal de confirmation */}
                                            {showConfirmModal && (
                                                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                                                    <div className="modal-dialog modal-dialog-centered modal-lg">
                                                        <div className="modal-content">
                                                            <div className="modal-header">
                                                                <h5 className="modal-title">
                                                                    Confirmer les modifications
                                                                </h5>
                                                                <button
                                                                    type="button"
                                                                    className="btn-close"
                                                                    onClick={handleCancelModal}
                                                                ></button>
                                                            </div>
                                                            <div className="modal-body">
                                                                <p className="text-muted mb-3">
                                                                    Vous êtes sur le point de modifier les informations suivantes :
                                                                </p>

                                                                {Object.keys(pendingChanges).length > 0 ? (
                                                                    <div className="table-responsive">
                                                                        <table className="table table-bordered">
                                                                            <thead className="table-light">
                                                                                <tr>
                                                                                    <th>Champ</th>
                                                                                    <th>Ancienne valeur</th>
                                                                                    <th>Nouvelle valeur</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {Object.entries(pendingChanges).map(([field, values]) => (
                                                                                    <tr key={field}>
                                                                                        <td className="fw-semibold">{getFieldLabel(field)}</td>
                                                                                        <td>
                                                                                            <span className="text-danger text-decoration-line-through">
                                                                                                {values.old || <em className="text-muted">Vide</em>}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td>
                                                                                            <span className="text-success fw-medium">
                                                                                                {values.new || <em className="text-muted">Vide</em>}
                                                                                            </span>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ) : (
                                                                    <div className="alert alert-info">
                                                                        Aucune modification détectée
                                                                    </div>
                                                                )}

                                                                <div className="alert alert-warning mt-3">
                                                                    <strong>Attention :</strong> Ces modifications seront appliquées immédiatement et de manière permanente.
                                                                </div>
                                                            </div>
                                                            <div className="modal-footer">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary"
                                                                    onClick={handleCancelModal}
                                                                >
                                                                    Annuler
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-primary"
                                                                    onClick={handleConfirmUpdate}
                                                                    disabled={Object.keys(pendingChanges).length === 0}
                                                                >
                                                                    Confirmer les modifications
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Carte modification mot de passe */}
                                    <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title">Changer le mot de passe</h4>
                                        </div>
                                        <div className="card-body pt-0">
                                            <form onSubmit={handlePasswordFormSubmit}>
                                                {/* Mot de passe actuel */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Mot de passe actuel
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <div className="input-group">
                                                            <input
                                                                className={`form-control ${passwordErrors.current_password ? 'is-invalid' : ''}`}
                                                                type={showPasswords.current_password ? 'text' : 'password'}
                                                                placeholder="Mot de passe"
                                                                name="current_password"
                                                                value={passwordData.current_password}
                                                                onChange={handlePasswordChange}
                                                            />
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                type="button"
                                                                onClick={() => togglePasswordVisibility('current_password')}
                                                                style={{ borderColor: passwordErrors.current_password ? '#dc3545' : '#dee2e6' }}
                                                            >
                                                                <i className={`las ${showPasswords.current_password ? 'la-eye-slash' : 'la-eye'} fs-18`}></i>
                                                            </button>
                                                            {passwordErrors.current_password && (
                                                                <div className="invalid-feedback d-block">
                                                                    {passwordErrors.current_password}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Nouveau mot de passe */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Nouveau mot de passe
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <div className="input-group">
                                                            <input
                                                                className={`form-control ${passwordErrors.new_password ? 'is-invalid' : ''}`}
                                                                type={showPasswords.new_password ? 'text' : 'password'}
                                                                placeholder="Nouveau mot de passe"
                                                                name="new_password"
                                                                value={passwordData.new_password}
                                                                onChange={handlePasswordChange}
                                                            />
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                type="button"
                                                                onClick={() => togglePasswordVisibility('new_password')}
                                                                style={{ borderColor: passwordErrors.new_password ? '#dc3545' : '#dee2e6' }}
                                                            >
                                                                <i className={`las ${showPasswords.new_password ? 'la-eye-slash' : 'la-eye'} fs-18`}></i>
                                                            </button>
                                                            {passwordErrors.new_password && (
                                                                <div className="invalid-feedback d-block">
                                                                    {passwordErrors.new_password}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <small className="text-muted">Minimum 8 caractères</small>
                                                    </div>
                                                </div>

                                                {/* Confirmer le mot de passe */}
                                                <div className="form-group mb-3 row">
                                                    <label className="col-xl-3 col-lg-3 text-end mb-lg-0 align-self-center form-label">
                                                        Confirmer le mot de passe
                                                    </label>
                                                    <div className="col-lg-9 col-xl-8">
                                                        <div className="input-group">
                                                            <input
                                                                className={`form-control ${passwordErrors.confirm_password ? 'is-invalid' : ''}`}
                                                                type={showPasswords.confirm_password ? 'text' : 'password'}
                                                                placeholder="Confirmer le mot de passe"
                                                                name="confirm_password"
                                                                value={passwordData.confirm_password}
                                                                onChange={handlePasswordChange}
                                                            />
                                                            <button
                                                                className="btn btn-outline-secondary"
                                                                type="button"
                                                                onClick={() => togglePasswordVisibility('confirm_password')}
                                                                style={{ borderColor: passwordErrors.confirm_password ? '#dc3545' : '#dee2e6' }}
                                                            >
                                                                <i className={`las ${showPasswords.confirm_password ? 'la-eye-slash' : 'la-eye'} fs-18`}></i>
                                                            </button>
                                                            {passwordErrors.confirm_password && (
                                                                <div className="invalid-feedback d-block">
                                                                    {passwordErrors.confirm_password}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="form-group row">
                                                    <div className="col-lg-9 col-xl-8 offset-lg-3">
                                                        <button type="submit" className="btn btn-primary">
                                                            Changer le mot de passe
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger ms-2"
                                                            onClick={handleCancelPasswordForm}
                                                        >
                                                            Annuler
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                            {/* Modal de confirmation du changement de mot de passe */}
                                            {showPasswordModal && (
                                                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                                                    <div className="modal-dialog modal-dialog-centered">
                                                        <div className="modal-content">
                                                            <div className="modal-header bg-warning-subtle">
                                                                <h5 className="modal-title text-warning">
                                                                    <i className="iconoir-lock text-warning me-2"></i>
                                                                    Confirmer le changement de mot de passe
                                                                </h5>
                                                                <button
                                                                    type="button"
                                                                    className="btn-close"
                                                                    onClick={handleCancelPasswordModal}
                                                                ></button>
                                                            </div>
                                                            <div className="modal-body">
                                                                <div className="alert alert-warning">
                                                                    <i className="iconoir-warning-triangle me-2"></i>
                                                                    <strong>Attention !</strong> Vous êtes sur le point de modifier le mot de passe de ce partenaire.
                                                                </div>

                                                                <div className="mb-3">
                                                                    <h6 className="fw-semibold mb-2">Informations du partenaire :</h6>
                                                                    <ul className="list-unstyled mb-0">
                                                                        <li className="mb-2">
                                                                            <i className="iconoir-user me-2 text-muted"></i>
                                                                            <strong>Nom :</strong> {partner?.name}
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <i className="iconoir-mail me-2 text-muted"></i>
                                                                            <strong>Email :</strong> {partner?.email}
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <i className="iconoir-phone me-2 text-muted"></i>
                                                                            <strong>Téléphone :</strong> {partner?.phone}
                                                                        </li>
                                                                    </ul>
                                                                </div>

                                                                <div className="alert alert-info mb-0">
                                                                    <i className="iconoir-info-circle me-2"></i>
                                                                    Le partenaire devra utiliser son nouveau mot de passe lors de sa prochaine connexion.
                                                                </div>
                                                            </div>
                                                            <div className="modal-footer">
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary"
                                                                    onClick={handleCancelPasswordModal}
                                                                >
                                                                    Annuler
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-warning"
                                                                    onClick={handleConfirmPasswordChange}
                                                                >
                                                                    Confirmer le changement
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Section Securité */}
                                <div className="tab-pane p-3" id="security" role="tabpanel">
                                    <div className="card">
                                        <div className="card-header">
                                            <div className="row align-items-center">
                                                <div className="col">
                                                    <h4 className="card-title">Sécurité</h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Carte Authentification à deux facteurs (2FA) */}
                                    <div className="card">
                                        <div className="card-body p-4">
                                            <div className="row align-items-center">
                                                {/* Icône à gauche */}
                                                <div className="col-auto">
                                                    <div className="position-relative" style={{ width: '80px', height: '80px' }}>
                                                        <div className="d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '80px',
                                                                height: '80px',
                                                                borderRadius: '12px',
                                                                
                                                            }}>
                                                            <i className="fas fa-mobile-alt" style={{ fontSize: '40px', color: '#1e40af' }}></i>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contenu principal */}
                                                <div className="col">
                                                    <div className="d-flex align-items-start justify-content-between mb-2">
                                                        <div>
                                                            <h5 className="mb-1 fw-bold" style={{ color: '#1f2937' }}>
                                                                Authentification à deux facteurs
                                                            </h5>
                                                            <span className="badge bg-success-subtle text-success px-2 py-1" style={{ fontSize: '12px' }}>
                                                                Recommandé
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <p className="text-muted mb-2" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                                                        Pour activer l'authentification à deux facteurs basée sur une application comme{' '}
                                                        <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary text-decoration-underline">
                                                            Google Authenticator
                                                        </a>
                                                        {' '}ou{' '}
                                                        <a href="https://authy.com/"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary text-decoration-underline">
                                                            Authy
                                                        </a>
                                                        , cliquez sur Activer et scannez le code QR avec l'application sur votre téléphone.
                                                    </p>

                                                    <a href="#"
                                                        className="text-danger text-decoration-underline"
                                                        style={{ fontSize: '13px' }}
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleOpen2FAInfoModal();
                                                        }}>
                                                        Comment ça marche ?
                                                    </a>
                                                </div>

                                                {/* Bouton Activer */}
                                                {partner?.two_factor_enabled ? <div className='col-auto'>
                                                    <span className="badge bg-success-subtle text-success px-2 py-1" style={{ fontSize: '12px' }}>2FA activé</span>
                                                </div> : (<div className="col-auto">
                                                    <button 
                                                        className="btn bg-primary text-white" 
                                                        onClick={handleEnable2FA}
                                                        disabled={loading2FA}
                                                    >
                                                        {loading2FA ? 'Chargement...' : 'Activer'}
                                                    </button>
                                                </div>)}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Modal 2FA - 2 étapes */}
                                    {show2FAModal && (
                                        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                                <div className="modal-content">
                                                    <div className="modal-header">
                                                        <h5 className="modal-title">
                                                            <i className="iconoir-lock me-2"></i>
                                                            Configuration de l'authentification à deux facteurs
                                                        </h5>
                                                        <button
                                                            type="button"
                                                            className="btn-close"
                                                            onClick={handleCancel2FAModal}
                                                        ></button>
                                                    </div>
                                                    <div className="modal-body">
                                                        {/* Indicateur d'étapes */}
                                                        <div className="d-flex justify-content-center mb-4">
                                                            <div className="d-flex align-items-center">
                                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${current2FAStep >= 1 ? 'bg-primary text-white' : 'bg-secondary text-white'}`}
                                                                    style={{ width: '40px', height: '40px', fontSize: '18px', fontWeight: 'bold' }}>
                                                                    1
                                                                </div>
                                                                <div className={`mx-2 ${current2FAStep >= 2 ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '60px', height: '3px' }}></div>
                                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${current2FAStep >= 2 ? 'bg-primary text-white' : 'bg-secondary text-white'}`}
                                                                    style={{ width: '40px', height: '40px', fontSize: '18px', fontWeight: 'bold' }}>
                                                                    2
                                                                </div>
                                                                <div className={`mx-2 ${current2FAStep >= 3 ? 'bg-primary' : 'bg-secondary'}`} style={{ width: '60px', height: '3px' }}></div>
                                                                <div className={`rounded-circle d-flex align-items-center justify-content-center ${current2FAStep >= 3 ? 'bg-primary text-white' : 'bg-secondary text-white'}`}
                                                                    style={{ width: '40px', height: '40px', fontSize: '18px', fontWeight: 'bold' }}>
                                                                    3
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Étape 1 : Backup Codes */}
                                                        {current2FAStep === 1 && (
                                                            <div>
                                                                <div className="alert alert-warning">
                                                                    <i className="iconoir-warning-triangle me-2"></i>
                                                                    <strong>Important :</strong> Sauvegardez ces codes de récupération dans un endroit sûr. 
                                                                    Vous en aurez besoin si vous perdez l'accès à votre application d'authentification.
                                                                </div>

                                                                <h6 className="mb-3 fw-semibold">Codes de récupération :</h6>
                                                                <div className="row g-2 mb-4">
                                                                    {backupCodes.map((code, index) => (
                                                                        <div key={index} className="col-md-6">
                                                                            <div className="card border">
                                                                                <div className="card-body p-3 text-center">
                                                                                    <code className="fs-5 fw-bold text-primary">{code}</code>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="alert alert-info">
                                                                    <i className="iconoir-info-circle me-2"></i>
                                                                    <strong>Conseil :</strong> Copiez ces codes et stockez-les dans un gestionnaire de mots de passe ou imprimez-les.
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Étape 2 : QR Code */}
                                                        {current2FAStep === 2 && (
                                                            <div>
                                                                <div className="alert alert-info mb-4">
                                                                    <i className="iconoir-info-circle me-2"></i>
                                                                    Scannez ce code QR avec votre application d'authentification (Google Authenticator, Authy, etc.)
                                                                </div>

                                                                <div className="text-center mb-4">
                                                                    {qrCodeUrl ? (
                                                                        <div className="d-inline-block p-3 bg-white border rounded">
                                                                            <img 
                                                                                src={qrCodeUrl} 
                                                                                alt="QR Code 2FA" 
                                                                                style={{ maxWidth: '300px', width: '100%' }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-muted">
                                                                            <i className="iconoir-image fs-1"></i>
                                                                            <p>Chargement du QR code...</p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="text-center">
                                                                    <h6 className="mb-2">Applications recommandées :</h6>
                                                                    <div className="d-flex justify-content-center gap-3">
                                                                        <a 
                                                                            href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-outline-primary btn-sm"
                                                                        >
                                                                            <i className="iconoir-smartphone-device me-1"></i>
                                                                            Google Authenticator
                                                                        </a>
                                                                        <a 
                                                                            href="https://authy.com/" 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-outline-primary btn-sm"
                                                                        >
                                                                            <i className="iconoir-smartphone-device me-1"></i>
                                                                            Authy
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Étape 3 : Vérification OTP */}
                                                        {current2FAStep === 3 && (
                                                            <div>
                                                                <div className="alert alert-info mb-4">
                                                                    <i className="iconoir-info-circle me-2"></i>
                                                                    <strong>Vérification :</strong> Saisissez le code à 6 chiffres affiché dans votre application d'authentification pour finaliser l'activation de la 2FA.
                                                                </div>

                                                                <div className="text-center mb-4">
                                                                    <label className="form-label fw-semibold mb-3">Code de vérification</label>
                                                                    <div className="d-flex justify-content-center gap-2" onPaste={handleOtpPaste}>
                                                                        {otpInputs.map((value, index) => (
                                                                            <input
                                                                                key={index}
                                                                                id={`otp-input-${index}`}
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

                                                                <div className="alert alert-warning">
                                                                    <i className="iconoir-warning-triangle me-2"></i>
                                                                    Assurez-vous que l'heure de votre appareil est correctement synchronisée pour que le code fonctionne.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="modal-footer">
                                                        {current2FAStep === 1 ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary"
                                                                    onClick={handleCancel2FAModal}
                                                                >
                                                                    Annuler
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-primary"
                                                                    onClick={handleNext2FAStep}
                                                                >
                                                                    Suivant
                                                                </button>
                                                            </>
                                                        ) : current2FAStep === 2 ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary"
                                                                    onClick={() => setCurrent2FAStep(1)}
                                                                >
                                                                    Précédent
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-success"
                                                                    onClick={() => setCurrent2FAStep(3)}
                                                                >
                                                                    Terminé
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary"
                                                                    onClick={() => setCurrent2FAStep(2)}
                                                                    disabled={loading2FA}
                                                                >
                                                                    Précédent
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-primary"
                                                                    onClick={() => handleVerify2FAStep(otpInputs.join(''))}
                                                                    disabled={loading2FA || otpInputs.join('').length !== 6}
                                                                >
                                                                    {loading2FA ? 'Vérification...' : 'Vérifier'}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* Modal d'information sur la 2FA */}
                                    {show2FAInfoModal && (
                                        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                                <div className="modal-content">
                                                    <div className="modal-header text-white" style={{ backgroundColor: '#141824' }}>
                                                        <h5 className="modal-title">
                                                            <i className="iconoir-lock me-2"></i>
                                                            Authentification à deux facteurs (2FA) - Comment ça marche ?
                                                        </h5>
                                                        <button
                                                            type="button"
                                                            className="btn-close btn-close-white"
                                                            onClick={handleClose2FAInfoModal}
                                                        ></button>
                                                    </div>
                                                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                                        {/* Qu'est-ce que la 2FA */}
                                                        <div className="mb-4">
                                                            <h6 className="fw-bold mb-3" style={{color: '#141824'}}>
                                                                <i className="iconoir-info-circle me-2"></i>
                                                                Qu'est-ce que l'authentification à deux facteurs ?
                                                            </h6>
                                                            <p className="text-muted">
                                                                L'authentification à deux facteurs (2FA) est une méthode de sécurité qui ajoute une couche supplémentaire de protection à votre compte. 
                                                                Au lieu de vous fier uniquement à votre mot de passe, vous devez également fournir un second facteur d'authentification pour vous connecter.
                                                            </p>
                                                        </div>

                                                        {/* Comment ça fonctionne */}
                                                        <div className="mb-4">
                                                            <h6 className="fw-bold mb-3" style={{color: '#141824'}}>
                                                                <i className="iconoir-settings me-2"></i>
                                                                Comment fonctionne le TOTP (Time-based One-Time Password) ?
                                                            </h6>
                                                            <div className="card bg-light">
                                                                <div className="card-body">
                                                                    <ol className="mb-0">
                                                                        <li className="mb-2">
                                                                            <strong>Activation :</strong> Vous scannez un code QR avec une application d'authentification (Google Authenticator, Authy, etc.)
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <strong>Synchronisation :</strong> L'application génère un code secret unique lié à votre compte
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <strong>Génération de codes :</strong> L'application génère automatiquement un code à 6 chiffres qui change toutes les 30 secondes
                                                                        </li>
                                                                        <li className="mb-2">
                                                                            <strong>Vérification :</strong> Lors de la connexion, vous saisissez ce code temporaire en plus de votre mot de passe
                                                                        </li>
                                                                        <li>
                                                                            <strong>Sécurité :</strong> Même si quelqu'un obtient votre mot de passe, il ne pourra pas accéder à votre compte sans votre téléphone
                                                                        </li>
                                                                    </ol>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Pourquoi c'est important */}
                                                        <div className="mb-4">
                                                            <h6 className="fw-bold text-success mb-3">
                                                                <i className="iconoir-shield-check me-2"></i>
                                                                Pourquoi la 2FA est-elle importante ?
                                                            </h6>
                                                            <div className="row g-3">
                                                                <div className="col-md-6">
                                                                    <div className="card border-success border-2 h-100">
                                                                        <div className="card-body">
                                                                            <h6 className="text-success fw-bold mb-2">
                                                                                Protection renforcée
                                                                            </h6>
                                                                            <p className="text-muted small mb-0">
                                                                                Protège votre compte même si votre mot de passe est compromis. Un attaquant aurait besoin de votre téléphone physique pour accéder à votre compte.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="card border-warning border-2 h-100">
                                                                        <div className="card-body">
                                                                            <h6 className="text-warning fw-bold mb-2">
                                                                                Prévention des attaques
                                                                            </h6>
                                                                            <p className="text-muted small mb-0">
                                                                                Empêche les attaques par force brute, le phishing et l'utilisation de mots de passe volés. Même avec votre mot de passe, un attaquant ne peut pas se connecter.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="card border-info border-2 h-100">
                                                                        <div className="card-body">
                                                                            <h6 className="text-info fw-bold mb-2">
                                                                                Sécurité des données
                                                                            </h6>
                                                                            <p className="text-muted small mb-0">
                                                                                Protège vos données sensibles, vos transactions financières et vos informations personnelles contre les accès non autorisés.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="card border-primary border-2 h-100">
                                                                        <div className="card-body">
                                                                            <h6 className="text-primary fw-bold mb-2">
                                                                                Conformité
                                                                            </h6>
                                                                            <p className="text-muted small mb-0">
                                                                                Répond aux exigences de sécurité modernes et aux meilleures pratiques recommandées par les experts en cybersécurité.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Codes de récupération */}
                                                        <div className="mb-4">
                                                            <h6 className="fw-bold text-warning mb-3">
                                                                <i className="iconoir-key me-2"></i>
                                                                Codes de récupération
                                                            </h6>
                                                            <div className="alert alert-warning">
                                                                <p className="mb-2">
                                                                    <strong>Important :</strong> Lors de l'activation de la 2FA, vous recevrez des codes de récupération à usage unique.
                                                                </p>
                                                                <ul className="mb-0">
                                                                    <li>Conservez ces codes dans un endroit sûr (gestionnaire de mots de passe, coffre-fort)</li>
                                                                    <li>Utilisez-les uniquement si vous perdez l'accès à votre application d'authentification</li>
                                                                    <li>Chaque code ne peut être utilisé qu'une seule fois</li>
                                                                    <li>Ne partagez jamais ces codes avec personne</li>
                                                                </ul>
                                                            </div>
                                                        </div>

                                                        {/* Applications recommandées */}
                                                        <div className="mb-3">
                                                            <h6 className="fw-bold text-primary mb-3">
                                                                <i className="iconoir-smartphone-device me-2"></i>
                                                                Applications recommandées
                                                            </h6>
                                                            <div className="d-flex flex-wrap gap-3">
                                                                <div className="card border" style={{ flex: '1', minWidth: '200px' }}>
                                                                    <div className="card-body text-center">
                                                                        <i className="iconoir-smartphone-device fs-2 text-primary mb-2"></i>
                                                                        <h6 className="fw-bold">Google Authenticator</h6>
                                                                        <p className="text-muted small mb-2">Gratuit et simple à utiliser</p>
                                                                        <a 
                                                                            href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-sm btn-outline-primary"
                                                                        >
                                                                            Télécharger
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                                <div className="card border" style={{ flex: '1', minWidth: '200px' }}>
                                                                    <div className="card-body text-center">
                                                                        <i className="iconoir-smartphone-device fs-2 text-info mb-2"></i>
                                                                        <h6 className="fw-bold">Authy</h6>
                                                                        <p className="text-muted small mb-2">Sauvegarde cloud et multi-appareils</p>
                                                                        <a 
                                                                            href="https://authy.com/" 
                                                                            target="_blank" 
                                                                            rel="noopener noreferrer"
                                                                            className="btn btn-sm btn-outline-info"
                                                                        >
                                                                            Télécharger
                                                                        </a>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Note finale */}
                                                        <div className="alert alert-info">
                                                            <i className="iconoir-light-bulb me-2"></i>
                                                            <strong>Astuce :</strong> Assurez-vous que l'heure de votre téléphone est correctement synchronisée pour que les codes fonctionnent correctement.
                                                        </div>
                                                    </div>
                                                    <div className="modal-footer">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary"
                                                            onClick={handleClose2FAInfoModal}
                                                        >
                                                            J'ai compris
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>{" "}
                        {/*end col*/}
                    </div>
                    {/*end row*/}
                </div>
                {/* container */}
                {/*Start Footer*/}
                <Footer />
                {/*end footer*/}
            </div>
        </Layout>
    )
}
