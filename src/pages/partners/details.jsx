import React, { useState, useEffect } from 'react'
import { Buffer } from 'buffer';
import { useSelector } from 'react-redux'
import { useParams, Link } from 'react-router';
import { sendToastError, sendToastSuccess } from '../../helpers';
import {
    getPartnerDetails,
    updatePartnerDetails,
    updatePartnerPassword,
    getAllPartners,
    blockPartner,
    unblockPartner
} from '../../config/urls/partners';
import { RESET_PASSWORD_URL } from '../../config/urls/authentication';
import { getTransactionTypes } from '../../config/urls/transaction';
import { createPartnerCommission } from '../../config/urls/commission';
import { createPartnerFee } from '../../config/urls/fee';
import { createWebhook, getPartnerWebhooks, deletePartnerWebhook } from '../../config/urls/webhook';
import { validateAndCleanImageUrl } from '../../utils';
import { Layout } from '../../components/layout'
import { Footer } from '../../components/footer'
import Avatar from '../../assets/images/avatar.png';
import { Loader } from '../../components/loader';
import './index.css';

export const PartnerDetails = () => {
    window.Buffer = window.Buffer || Buffer;
    const token = useSelector(state => state.auth.token)
    const [partner, setPartner] = useState(null)
    const [loading, setLoading] = useState(true)
    const [transactionTypes, setTransactionTypes] = useState([]);
    const { id } = useParams();
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        name: '',
        phone: '',
        address: '',
        city: '',
        country: ''
    });
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingChanges, setPendingChanges] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({});
    const [showPasswords, setShowPasswords] = useState({
        current_password: false,
        new_password: false,
        confirm_password: false
    });
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [feesFormData, setFeesFormData] = useState({
        code: '',
        type: '',
        transaction_type: '',
        value: ''
    });
    const [feesErrors, setFeesErrors] = useState({});
    const [isSubmittingFees, setIsSubmittingFees] = useState(false);

    const [commissionFormData, setCommissionFormData] = useState({
        value: '',
        partner_id: '',
        fees_id: ''
    });
    const [commissionErrors, setCommissionErrors] = useState({});
    const [isSubmittingCommission, setIsSubmittingCommission] = useState(false);
    const [eligiblePartners, setEligiblePartners] = useState([]);
    const [availableFees, setAvailableFees] = useState([]);

    const [webhookFormData, setWebhookFormData] = useState({
        name: '',
        url: '',
        secret: '',
        events: 'success',
        headers: '',
        content_type: 'application/json',
        timeout: '30000',
        max_retries: '5',
        retry_delay: '1000',
        custom_parameters: ''
    });
    const [webhookErrors, setWebhookErrors] = useState({});
    const [isSubmittingWebhook, setIsSubmittingWebhook] = useState(false);
    const [partnerWebhooks, setPartnerWebhooks] = useState([]);
    const [loadingWebhooks, setLoadingWebhooks] = useState(false);
    const [showDeleteWebhookModal, setShowDeleteWebhookModal] = useState(false);
    const [webhookToDelete, setWebhookToDelete] = useState(null);
    const [isDeletingWebhook, setIsDeletingWebhook] = useState(false);
    const [isBlockingPartner, setIsBlockingPartner] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [isUnblockingPartner, setIsUnblockingPartner] = useState(false);
    const [showUnblockModal, setShowUnblockModal] = useState(false);

    const handleWebhookInputChange = (e) => {
        const { name, value } = e.target;
        if (['timeout', 'max_retries', 'retry_delay'].includes(name)) {
            const numericValue = value.replace(/[^0-9]/g, '');
            setWebhookFormData(prev => ({
                ...prev,
                [name]: numericValue
            }));
        } else {
            setWebhookFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Effacer l'erreur du champ modifié
        if (webhookErrors[name]) {
            setWebhookErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateWebhookForm = () => {
        const errors = {};

        if (!webhookFormData.name.trim()) {
            errors.name = 'Le nom est requis';
        }

        if (!webhookFormData.url.trim()) {
            errors.url = 'L\'URL est requise';
        } else {
            try {
                new URL(webhookFormData.url);
            } catch {
                errors.url = 'L\'URL n\'est pas valide';
            }
        }

        if (!webhookFormData.events) {
            errors.events = 'L\'événement est requis';
        }

        if (!webhookFormData.timeout || parseInt(webhookFormData.timeout) <= 0) {
            errors.timeout = 'Le délai d\'expiration doit être supérieur à 0';
        }

        if (!webhookFormData.max_retries || parseInt(webhookFormData.max_retries) < 0) {
            errors.max_retries = 'Le nombre de tentatives doit être supérieur ou égal à 0';
        }

        if (!webhookFormData.retry_delay || parseInt(webhookFormData.retry_delay) <= 0) {
            errors.retry_delay = 'Le délai entre tentatives doit être supérieur à 0';
        }

        setWebhookErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitWebhook = async (e) => {
        e.preventDefault();

        if (!validateWebhookForm()) {
            sendToastError('Veuillez corriger les erreurs du formulaire');
            return;
        }

        setIsSubmittingWebhook(true);

        try {
            const response = await fetch(createWebhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...webhookFormData,
                    timeout: parseInt(webhookFormData.timeout),
                    max_retries: parseInt(webhookFormData.max_retries),
                    retry_delay: parseInt(webhookFormData.retry_delay),
                    partner_id: partner.id
                })
            });

            const data = await response.json();

            if (data.success) {
                sendToastSuccess('Webhook configuré avec succès');
                fetchPartnerDetails();
                fetchPartnerWebhooks();
                setWebhookFormData({
                    name: '',
                    url: '',
                    secret: '',
                    events: 'transaction.success',
                    headers: '',
                    content_type: 'application/json',
                    timeout: '30000',
                    max_retries: '5',
                    retry_delay: '2000',
                    custom_parameters: ''
                });
            } else {
                sendToastError(data.message || 'Erreur lors de la configuration du webhook');
            }
        } catch (error) {
            console.error('Erreur:', error);
            sendToastError('Une erreur est survenue');
        } finally {
            setIsSubmittingWebhook(false);
        }
    };

    const handleCancelWebhook = () => {
        setWebhookFormData({
            name: '',
            url: '',
            secret: '',
            events: 'transaction.success',
            headers: '',
            content_type: 'application/json',
            timeout: '30000',
            max_retries: '5',
            retry_delay: '2000',
            custom_parameters: ''
        });
        setWebhookErrors({});
    };

    const handleOpenResetPasswordModal = () => {
        setShowResetPasswordModal(true);
    };

    const handleCloseResetPasswordModal = () => {
        setShowResetPasswordModal(false);
    };

    const handleConfirmResetPassword = async () => {
        setIsResettingPassword(true);
        try {
            const response = await fetch(RESET_PASSWORD_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: partner.email
                })
            });

            const result = await response.json();

            if (result.success) {
                setShowResetPasswordModal(false);
                sendToastSuccess('Le mot de passe a été réinitialisé avec succès. Un email contenant le nouveau mot de passe a été envoyé au partenaire.');
            } else {
                sendToastError(result.message || 'Erreur lors de la réinitialisation du mot de passe');
            }
        } catch (error) {
            console.error('Erreur lors de la réinitialisation du mot de passe:', error);
            sendToastError('Erreur lors de la réinitialisation du mot de passe');
        } finally {
            setIsResettingPassword(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
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

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!hasChanges || Object.keys(pendingChanges).length === 0) {
            sendToastError('Aucune modification détectée');
            return;
        }
        setShowConfirmModal(true);
    };

    const handleConfirmUpdate = async () => {
        setShowConfirmModal(false);
        await handleSubmitUpdate();
    };

    const handleCancelModal = () => {
        setShowConfirmModal(false);
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

    const fetchPartnerDetails = async () => {

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

    const handlePasswordFormSubmit = (e) => {
        e.preventDefault();

        if (validatePasswordForm()) {
            setShowPasswordModal(true);
        }
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

    const fetchTransactionTypes = async () => {
        try {
            const response = await fetch(`${getTransactionTypes}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await response.json();
            if (result.success) {
                setTransactionTypes(result.data);
            } else {
                sendToastError('Erreur lors de la récupération des types de transactions');
            }
        } catch (error) {
            console.error('Erreur:', error);
            sendToastError('Erreur lors de la récupération des types de transactions');
        }
    }

    const handleFeesInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'value') {
            const regex = /^[0-9]*[.,]?[0-9]*$/;
            if (value !== '' && !regex.test(value)) {
                return;
            }
        }

        setFeesFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Effacer l'erreur du champ modifié
        if (feesErrors[name]) {
            setFeesErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateFeesForm = () => {
        const errors = {};

        if (!feesFormData.code.trim()) {
            errors.code = 'Le code est requis';
        } else if (feesFormData.code.length < 3) {
            errors.code = 'Le code doit contenir au moins 3 caractères';
        }

        if (!feesFormData.type) {
            errors.type = 'Le type de frais est requis';
        }

        if (!feesFormData.transaction_type) {
            errors.transaction_type = 'Le type de transaction est requis';
        }

        if (!feesFormData.value) {
            errors.value = 'La valeur est requise';
        } else {
            const numValue = parseFloat(feesFormData.value.replace(',', '.'));
            if (isNaN(numValue) || numValue <= 0) {
                errors.value = 'La valeur doit être un nombre positif';
            }

            if (feesFormData.type === 'percentage' && numValue > 100) {
                errors.value = 'Le pourcentage ne peut pas dépasser 100%';
            }
        }

        setFeesErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitFees = async (e) => {
        e.preventDefault();

        if (!validateFeesForm()) {
            sendToastError('Veuillez corriger les erreurs avant de soumettre');
            return;
        }

        setIsSubmittingFees(true);

        try {
            // Convertir la virgule en point pour l'API
            const valueFormatted = feesFormData.value.replace(',', '.');
            const response = await fetch(`${createPartnerFee}/${partner.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'x-api-key': import.meta.env.VITE_ADMIN_X_API_KEY
                },
                body: JSON.stringify({
                    code: feesFormData.code.trim(),
                    type: feesFormData.type,
                    transaction_type_id: feesFormData.transaction_type === 'PAYIN' ? 1 : 2,
                    value: parseFloat(valueFormatted)
                })
            });

            const result = await response.json();

            if (result.success) {
                sendToastSuccess('Frais configurés avec succès');
                // Réinitialiser le formulaire
                setFeesFormData({
                    code: '',
                    type: '',
                    transaction_type: '',
                    value: ''
                });
                setFeesErrors({});
                fetchPartnerDetails();
            } else {
                sendToastError(result.message || 'Erreur lors de la configuration des frais');
            }
        } catch (error) {
            sendToastError('Erreur lors de la configuration des frais');
        } finally {
            setIsSubmittingFees(false);
        }
    };

    const handleCancelFees = () => {
        setFeesFormData({
            code: '',
            type: '',
            transaction_type: '',
            value: ''
        });
        setFeesErrors({});
    };

    const handleCommissionInputChange = (e) => {
        const { name, value } = e.target;

        if (name === 'value') {
            const regex = /^[0-9]*[.,]?[0-9]*$/;
            if (value !== '' && !regex.test(value)) {
                return;
            }
        }

        setCommissionFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (commissionErrors[name]) {
            setCommissionErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateCommissionForm = () => {
        const errors = {};

        if (!commissionFormData.value) {
            errors.value = 'La valeur de la commission est requise';
        } else {
            const numValue = parseFloat(commissionFormData.value.replace(',', '.'));
            if (isNaN(numValue) || numValue <= 0) {
                errors.value = 'La valeur doit être un nombre positif';
            }

            const selectedFee = availableFees.find(f => f.id === parseInt(commissionFormData.fees_id));
            if (selectedFee && selectedFee.type === 'percentage' && numValue > selectedFee.value) {
                errors.value = `La commission ne peut pas dépasser le frais de ${selectedFee.value}%`;
            }
        }

        if (!commissionFormData.partner_id) {
            errors.partner_id = 'Veuillez sélectionner un partenaire';
        }

        if (!commissionFormData.fees_id) {
            errors.fees_id = 'Veuillez sélectionner un type de frais';
        }

        setCommissionErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitCommission = async (e) => {
        e.preventDefault();

        if (!validateCommissionForm()) {
            return;
        }

        setIsSubmittingCommission(true);

        try {
            const valueFormatted = commissionFormData.value.replace(',', '.');

            const response = await fetch(`${createPartnerCommission}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value: parseFloat(valueFormatted),
                    partnerId: parseInt(commissionFormData.partner_id),
                    feeId: parseInt(commissionFormData.fees_id)
                })
            });

            const result = await response.json();

            if (result.success) {
                sendToastSuccess('Commission configurée avec succès');
                setCommissionFormData({
                    value: '',
                    partner_id: '',
                    fees_id: ''
                });
                setCommissionErrors({});
            } else {
                sendToastError(result.message || 'Erreur lors de la configuration de la commission');
            }
        } catch (error) {
            console.error('Erreur lors de la configuration de la commission:', error);
            sendToastError('Erreur lors de la configuration de la commission');
        } finally {
            setIsSubmittingCommission(false);
        }
    };

    const handleCancelCommission = () => {
        setCommissionFormData({
            value: '',
            partner_id: '',
            fees_id: ''
        });
        setCommissionErrors({});
    };

    const fetchPartnerWebhooks = async () => {
        try {
            setLoadingWebhooks(true);
            const response = await fetch(`${getPartnerWebhooks}?partner_id=${partner.id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (result.success) {
                setLoadingWebhooks(false);
                setPartnerWebhooks(result.data);
            } else {
                setLoadingWebhooks(false);
                sendToastError(result.message || 'Erreur lors de la récupération des webhooks du partenaire');
            }
        } catch (error) {
            setLoadingWebhooks(false);
            sendToastError('Erreur lors de la récupération des webhooks du partenaire');
        }
    }

    const handleDeleteWebhook = async () => {
        setIsDeletingWebhook(true);
        try {
            const response = await fetch(`${deletePartnerWebhook}/${partner.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    webhook_id: parseInt(webhookToDelete.id)
                })
            });

            const result = await response.json();

            if (result.success) {
                sendToastSuccess('Webhook supprimé avec succès');
                fetchPartnerWebhooks();
                setShowDeleteWebhookModal(false);
            } else {
                sendToastError(result.message || 'Erreur lors de la suppression du webhook');
            }
        } catch (error) {
            console.error('Erreur:', error);
            sendToastError('Une erreur est survenue lors de la suppression du webhook');
        } finally {
            setIsDeletingWebhook(false);
        }
    };

    const handleOpenDeleteWebhookModal = (webhook) => {
        setWebhookToDelete(webhook);
        setShowDeleteWebhookModal(true);
    };

    const handleCloseDeleteWebhookModal = () => {
        setShowDeleteWebhookModal(false);
        setWebhookToDelete(null);
    };

    const handleConfirmBlockPartner = async () => {
        try {
            setIsBlockingPartner(true);
            const response = await fetch(`${blockPartner}/${partner.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (result.success) {
                sendToastSuccess(result.message || 'Partenaire bloqué avec succès');
                fetchPartnerDetails();
            } else {
                sendToastError(result.message || 'Erreur lors du blocage du partenaire');
            }
        } catch (error) {
            console.error('Erreur:', error);
            sendToastError('Une erreur est survenue lors du blocage du partenaire');
        } finally {
            setIsBlockingPartner(false);
            setShowBlockModal(false);
        }
    }

    const handleCloseBlockModal = () => {
        setShowBlockModal(false);
    }

    const handleOpenBlockModal = () => {
        setShowBlockModal(true);
    }

    const handleOpenUnblockModal = () => {
        setShowUnblockModal(true);
    };

    const handleCloseUnblockModal = () => {
        setShowUnblockModal(false);
    };

    const handleUnblockPartner = async () => {
        try {
            setIsUnblockingPartner(true);
            const response = await fetch(`${unblockPartner}/${partner.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            if (result.success) {
                sendToastSuccess(result.message || 'Partenaire débloqué avec succès');
                fetchPartnerDetails();
                setShowUnblockModal(false);
            } else {
                sendToastError(result.message || 'Erreur lors du déblocage du partenaire');
            }
        } catch (error) {
            console.error('Erreur:', error);
            sendToastError('Une erreur est survenue lors du déblocage du partenaire');
        } finally {
            setIsUnblockingPartner(false);
        }
    };

    useEffect(() => {
        fetchPartnerDetails();
        fetchTransactionTypes();
    }, []);

    useEffect(() => {
        if (partner?.fees) {
            setAvailableFees(partner.fees);
        }
    }, [partner?.fees]);

    useEffect(() => {
        const fetchEligiblePartners = async () => {
            const queryString = `role_id=1,2`;

            try {
                const response = await fetch(`${getAllPartners}?${queryString}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });
                const result = await response.json();
                if (result.success) {
                    setEligiblePartners(result.data?.partners);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des partenaires éligibles:', error);
            }
        };

        if (partner?.id) {
            fetchEligiblePartners();
            fetchPartnerWebhooks();
        }
    }, [partner?.id, token]);

    if (loading) {
        return <Layout>
            <div className='page-content'>
                <div className='h-100 w-100 d-flex justify-content-center align-items-center'>
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
                                        {/*end nav-item*/}
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
                        <div className="col-md-4">
                            <div className="card">
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
                                                    <i className="iconoir-wallet fs-20 me-1 text-muted" />
                                                    <span className="text-body fw-semibold">
                                                        Identifiant du partenaire :
                                                    </span>{" "}
                                                    {/* <span className='ms-1'>{partner?.commission_balances[0]?.amount || '0'} FCFA</span> */}
                                                    <span className='ms-1'>{partner?.id || 'N/A'}</span>
                                                </div>
                                                <div className="text-body mb-2 d-flex align-items-center">
                                                    <i className="iconoir-wallet fs-20 me-1 text-muted" />
                                                    <span className="text-body fw-semibold">
                                                        Balance du partenaire :
                                                    </span>{" "}
                                                    {/* <span className='ms-1'>{partner?.commission_balances[0]?.amount || '0'} FCFA</span> */}
                                                    <span className='ms-1'>{partner?.commission_balances[0]?.amount || '0'} FCFA</span>
                                                </div>
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
                                                {
                                                    partner?.active ?
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger d-inline-block"
                                                            onClick={handleOpenBlockModal}
                                                        >
                                                            Bloquer ce partenaire
                                                        </button>
                                                        :
                                                        <button
                                                            type="button"
                                                            className="btn btn-success d-inline-block"
                                                            onClick={handleOpenUnblockModal}
                                                        >
                                                            Débloquer ce partenaire
                                                        </button>
                                                }

                                            </div>
                                        </div>
                                        {/*end col*/}
                                    </div>
                                    {/*end row*/}
                                </div>
                                {/*end card-body*/}
                            </div>
                            {/*end card*/}
                            {/*end card*/}
                        </div>{" "}
                        {/*end col*/}
                        <div className="col-md-8">
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
                                        href="#fees"
                                        role="tab"
                                        aria-selected="false"
                                    >
                                        Frais
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium"
                                        data-bs-toggle="tab"
                                        href="#commissions"
                                        role="tab"
                                        aria-selected="false"
                                    >
                                        Commissions
                                    </a>
                                </li>
                                <li className="nav-item">
                                    <a
                                        className="nav-link fw-medium"
                                        data-bs-toggle="tab"
                                        href="#webhooks"
                                        role="tab"
                                        aria-selected="false"
                                    >
                                        Webhooks
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

                                                    {/* Résumé des commissions */}
                                                    {/* {partner?.commissions && partner.commissions.length > 0 && (
                                                        <div className="mt-4 pt-3 border-top">
                                                            <div className="row">
                                                                <div className="col-md-6">
                                                                    <div className="card bg-primary-subtle border-0">
                                                                        <div className="card-body">
                                                                            <div className="d-flex align-items-center">
                                                                                <div className="flex-shrink-0">
                                                                                    <div className="d-flex justify-content-center align-items-center thumb-md bg-primary rounded-circle">
                                                                                        <i className="iconoir-arrow-down-left fs-20 text-white"></i>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-grow-1 ms-3">
                                                                                    <p className="text-muted mb-1">Commissions PAYIN</p>
                                                                                    <h4 className="mb-0">
                                                                                        {partner.commissions.filter(c => c.fee?.transaction_type?.name === 'PAYIN').length}
                                                                                    </h4>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-6">
                                                                    <div className="card bg-info-subtle border-0">
                                                                        <div className="card-body">
                                                                            <div className="d-flex align-items-center">
                                                                                <div className="flex-shrink-0">
                                                                                    <div className="d-flex justify-content-center align-items-center thumb-md bg-info rounded-circle">
                                                                                        <i className="iconoir-arrow-up-right fs-20 text-white"></i>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-grow-1 ms-3">
                                                                                    <p className="text-muted mb-1">Commissions PAYOUT</p>
                                                                                    <h4 className="mb-0">
                                                                                        {partner.commissions.filter(c => c.fee?.transaction_type?.name === 'PAYOUT').length}
                                                                                    </h4>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )} */}
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

                                    {/* Carte réinitialisation mot de passe */}
                                    <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title">
                                                <i className="iconoir-refresh me-2"></i>
                                                Réinitialiser le mot de passe
                                            </h4>
                                        </div>
                                        <div className="card-body">
                                            <div className="alert alert-info mb-3">
                                                <i className="iconoir-info-circle me-2"></i>
                                                <strong>Information :</strong> Cette fonction permet de réinitialiser le mot de passe d'un partenaire en générant un nouveau mot de passe et en l'envoyant par email.
                                            </div>

                                            <div className="mb-3">
                                                <h6 className="fw-semibold mb-2">Comment fonctionne la réinitialisation ?</h6>
                                                <ul className="mb-0">
                                                    <li className="mb-2">
                                                        <i className="iconoir-check-circle text-success me-2"></i>
                                                        Un nouveau mot de passe sécurisé sera généré automatiquement
                                                    </li>
                                                    <li className="mb-2">
                                                        <i className="iconoir-mail text-primary me-2"></i>
                                                        Le nouveau mot de passe sera envoyé à l'adresse email du partenaire : <strong>{partner?.email}</strong>
                                                    </li>
                                                    <li className="mb-2">
                                                        <i className="iconoir-lock text-warning me-2"></i>
                                                        L'ancien mot de passe ne sera plus valide immédiatement
                                                    </li>
                                                    <li className="mb-2">
                                                        <i className="iconoir-user text-info me-2"></i>
                                                        Le partenaire devra utiliser le nouveau mot de passe pour se connecter
                                                    </li>
                                                </ul>
                                            </div>

                                            <div className="alert alert-warning">
                                                <i className="iconoir-warning-triangle me-2"></i>
                                                <strong>Attention :</strong> Cette action est irréversible. Le partenaire recevra un email avec son nouveau mot de passe.
                                            </div>

                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                onClick={handleOpenResetPasswordModal}
                                            >
                                                <i className="iconoir-refresh me-2"></i>
                                                Réinitialiser le mot de passe
                                            </button>
                                        </div>
                                    </div>

                                    {/* Modal de confirmation de réinitialisation */}
                                    {showResetPasswordModal && (
                                        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                                <div className="modal-content">
                                                    <div className="modal-header bg-danger-subtle">
                                                        <h5 className="modal-title text-danger">
                                                            <i className="iconoir-warning-triangle me-2"></i>
                                                            Confirmer la réinitialisation du mot de passe
                                                        </h5>
                                                        <button
                                                            type="button"
                                                            className="btn-close"
                                                            onClick={handleCloseResetPasswordModal}
                                                            disabled={isResettingPassword}
                                                        ></button>
                                                    </div>
                                                    <div className="modal-body">
                                                        <div className="alert alert-danger">
                                                            <i className="iconoir-warning-triangle me-2"></i>
                                                            <strong>Action critique !</strong> Vous êtes sur le point de réinitialiser le mot de passe de ce partenaire.
                                                        </div>

                                                        <div className="mb-3">
                                                            <h6 className="fw-semibold mb-2">Informations du partenaire :</h6>
                                                            <div className="card bg-light">
                                                                <div className="card-body">
                                                                    <div className="row">
                                                                        <div className="col-md-6 mb-2">
                                                                            <i className="iconoir-user me-2 text-muted"></i>
                                                                            <strong>Nom :</strong> {partner?.name}
                                                                        </div>
                                                                        <div className="col-md-6 mb-2">
                                                                            <i className="iconoir-briefcase me-2 text-muted"></i>
                                                                            <strong>Type :</strong> {partner?.role?.name === 'merchant' ? 'Marchand' : 'Partenaire'}
                                                                        </div>
                                                                        <div className="col-md-6 mb-2">
                                                                            <i className="iconoir-mail me-2 text-muted"></i>
                                                                            <strong>Email :</strong> {partner?.email}
                                                                        </div>
                                                                        <div className="col-md-6 mb-2">
                                                                            <i className="iconoir-phone me-2 text-muted"></i>
                                                                            <strong>Téléphone :</strong> {partner?.phone}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="mb-3">
                                                            <h6 className="fw-semibold mb-2">Ce qui va se passer :</h6>
                                                            <div className="timeline">
                                                                <div className="d-flex mb-3">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="d-flex justify-content-center align-items-center thumb-sm bg-primary rounded-circle text-white">
                                                                            1
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 ms-3">
                                                                        <p className="mb-0">
                                                                            <strong>Génération automatique</strong><br />
                                                                            <small className="text-muted">Un nouveau mot de passe sécurisé sera généré automatiquement par le système</small>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex mb-3">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="d-flex justify-content-center align-items-center thumb-sm bg-info rounded-circle text-white">
                                                                            2
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 ms-3">
                                                                        <p className="mb-0">
                                                                            <strong>Envoi par email</strong><br />
                                                                            <small className="text-muted">Le nouveau mot de passe sera envoyé à l'adresse : <strong>{partner?.email}</strong></small>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex mb-3">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="d-flex justify-content-center align-items-center thumb-sm bg-warning rounded-circle text-white">
                                                                            3
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 ms-3">
                                                                        <p className="mb-0">
                                                                            <strong>Invalidation immédiate</strong><br />
                                                                            <small className="text-muted">L'ancien mot de passe ne sera plus valide et le partenaire devra utiliser le nouveau</small>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="d-flex">
                                                                    <div className="flex-shrink-0">
                                                                        <div className="d-flex justify-content-center align-items-center thumb-sm bg-success rounded-circle text-white">
                                                                            4
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-grow-1 ms-3">
                                                                        <p className="mb-0">
                                                                            <strong>Notification du partenaire</strong><br />
                                                                            <small className="text-muted">Le partenaire recevra un email avec les instructions de connexion</small>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="alert alert-warning mb-0">
                                                            <i className="iconoir-shield-alert me-2"></i>
                                                            <strong>Important :</strong> Cette action est irréversible. Assurez-vous que l'adresse email du partenaire est correcte avant de continuer.
                                                        </div>
                                                    </div>
                                                    <div className="modal-footer">
                                                        <button
                                                            type="button"
                                                            className="btn btn-secondary"
                                                            onClick={handleCloseResetPasswordModal}
                                                            disabled={isResettingPassword}
                                                        >
                                                            <i className="iconoir-cancel me-2"></i>
                                                            Annuler
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-danger"
                                                            onClick={handleConfirmResetPassword}
                                                            disabled={isResettingPassword}
                                                        >
                                                            {isResettingPassword ? (
                                                                <>
                                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                    Réinitialisation en cours...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="iconoir-refresh me-2"></i>
                                                                    Confirmer la réinitialisation
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Autres paramètres */}
                                    {/* <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title">Autres paramètres</h4>
                                        </div>
                                        <div className="card-body pt-0">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="active_status"
                                                    defaultChecked={partner?.active}
                                                />
                                                <label className="form-check-label" htmlFor="active_status">
                                                    Statut actif
                                                </label>
                                                <span className="form-text text-muted fs-12 mt-0 d-block">
                                                    Activer ou désactiver le compte partenaire
                                                </span>
                                            </div>
                                            <div className="form-check mt-3">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id="email_notifications"
                                                />
                                                <label className="form-check-label" htmlFor="email_notifications">
                                                    Notifications par email
                                                </label>
                                                <span className="form-text text-muted font-12 mt-0 d-block">
                                                    Recevoir les notifications par email
                                                </span>
                                            </div>
                                        </div>
                                    </div> */}
                                </div>
                                {/* Section Frais */}
                                <div className="tab-pane p-3" id="fees" role="tabpanel">
                                    {/* Carte de configuration des frais */}
                                    <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title">
                                                <i className="iconoir-percentage me-2"></i>
                                                Configuration des frais
                                            </h4>
                                        </div>
                                        <div className="card-body">
                                            <div className="alert alert-info mb-3">
                                                <i className="iconoir-info-circle me-2"></i>
                                                <strong>Information :</strong> Cette section permet de configurer les frais appliqués aux transactions de ce partenaire.
                                            </div>

                                            <div className="mb-4">
                                                <h6 className="fw-semibold mb-2">
                                                    <i className="iconoir-help-circle me-2"></i>
                                                    Comment configurer les frais ?
                                                </h6>
                                                <ul className="mb-0">
                                                    <li className="mb-2">
                                                        <strong>Code :</strong> Un identifiant unique pour ces frais (ex: "payin_standard_fee")
                                                    </li>
                                                    <li className="mb-2">
                                                        <strong>Type de frais :</strong>
                                                        <ul className="mt-1">
                                                            <li><span className="badge bg-primary-subtle text-primary me-1">Percentage</span> - Un pourcentage du montant de la transaction (ex: 2.5%)</li>
                                                            <li><span className="badge bg-secondary-subtle text-secondary me-1">Fixed</span> - Un montant fixe en FCFA (ex: 500 FCFA) <span className="text-muted">(Bientôt disponible)</span></li>
                                                        </ul>
                                                    </li>
                                                    <li className="mb-2">
                                                        <strong>Type de transaction :</strong>
                                                        <ul className="mt-1">
                                                            <li><span className="badge bg-info-subtle text-info me-1">PAYIN</span> - Frais sur les paiements entrants</li>
                                                            <li><span className="badge bg-warning-subtle text-warning me-1">PAYOUT</span> - Frais sur les transferts sortants</li>
                                                        </ul>
                                                    </li>
                                                    <li className="mb-2">
                                                        <strong>Valeur :</strong> Le montant du frais (pourcentage ou montant fixe selon le type choisi)
                                                    </li>
                                                </ul>
                                            </div>

                                            <form onSubmit={handleSubmitFees}>
                                                <div className="row">
                                                    {/* Code */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-semibold">
                                                            Code des frais <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${feesErrors.code ? 'is-invalid' : ''}`}
                                                            placeholder="Ex: payin_standard_fee"
                                                            name="code"
                                                            value={feesFormData.code}
                                                            onChange={handleFeesInputChange}
                                                        />
                                                        {feesErrors.code && (
                                                            <div className="invalid-feedback d-block">
                                                                {feesErrors.code}
                                                            </div>
                                                        )}
                                                        <small className="text-muted">Identifiant unique pour ces frais</small>
                                                    </div>

                                                    {/* Type de frais */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-semibold">
                                                            Type de frais <span className="text-danger">*</span>
                                                        </label>
                                                        <select
                                                            className={`form-select ${feesErrors.type ? 'is-invalid' : ''}`}
                                                            name="type"
                                                            value={feesFormData.type}
                                                            onChange={handleFeesInputChange}
                                                        >
                                                            <option value="">Sélectionner un type</option>
                                                            <option value="percentage">Pourcentage (%)</option>
                                                            <option value="fixed" disabled>Montant fixe (FCFA) Bientôt disponible</option>
                                                        </select>
                                                        {feesErrors.type && (
                                                            <div className="invalid-feedback d-block">
                                                                {feesErrors.type}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Type de transaction */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-semibold">
                                                            Type de transaction <span className="text-danger">*</span>
                                                        </label>
                                                        <select
                                                            className={`form-select ${feesErrors.transaction_type ? 'is-invalid' : ''}`}
                                                            name="transaction_type"
                                                            value={feesFormData.transaction_type}
                                                            onChange={handleFeesInputChange}
                                                        >
                                                            <option value="">Sélectionner un type</option>
                                                            {transactionTypes.map((type) => (
                                                                <option key={type.id} value={type.name}>
                                                                    {type.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {feesErrors.transaction_type && (
                                                            <div className="invalid-feedback d-block">
                                                                {feesErrors.transaction_type}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Valeur */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-semibold">
                                                            Valeur <span className="text-danger">*</span>
                                                        </label>
                                                        <div className="input-group">
                                                            <input
                                                                type="text"
                                                                className={`form-control ${feesErrors.value ? 'is-invalid' : ''}`}
                                                                placeholder="Ex: 2.5 ou 500"
                                                                name="value"
                                                                value={feesFormData.value}
                                                                onChange={handleFeesInputChange}
                                                            />
                                                            <span className="input-group-text">
                                                                {feesFormData.type === 'percentage' ? '%' : feesFormData.type === 'fixed' ? 'FCFA' : ''}
                                                            </span>
                                                            {feesErrors.value && (
                                                                <div className="invalid-feedback d-block">
                                                                    {feesErrors.value}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <small className="text-muted">
                                                            {feesFormData.type === 'percentage'
                                                                ? 'Entrez un pourcentage entre 0 et 100'
                                                                : feesFormData.type === 'fixed'
                                                                    ? 'Entrez un montant en FCFA'
                                                                    : 'Nombres et virgules autorisés (ex: 2,5 ou 2.5)'
                                                            }
                                                        </small>
                                                    </div>
                                                </div>

                                                {/* Aperçu des frais */}
                                                {feesFormData.code && feesFormData.type && feesFormData.transaction_type && feesFormData.value && (
                                                    <div className="alert alert-success mb-3">
                                                        <h6 className="fw-semibold mb-2">
                                                            Aperçu de la configuration
                                                        </h6>
                                                        <p className="mb-0">
                                                            <strong>Code :</strong> <code>{feesFormData.code}</code><br />
                                                            <strong>Type :</strong> <span className={`badge ${feesFormData.type === 'percentage' ? 'bg-primary' : 'bg-secondary'}`}>
                                                                {feesFormData.type === 'percentage' ? 'Pourcentage' : 'Montant fixe'}
                                                            </span><br />
                                                            <strong>Transaction :</strong> <span className={`badge ${feesFormData.transaction_type === 'PAYIN' ? 'bg-info' : 'bg-warning'}`}>
                                                                {feesFormData.transaction_type}
                                                            </span><br />
                                                            <strong>Valeur :</strong> <span className="text-success fw-bold">
                                                                {feesFormData.value}{feesFormData.type === 'percentage' ? '%' : ' FCFA'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Boutons */}
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        disabled={isSubmittingFees}
                                                    >
                                                        {isSubmittingFees ? (
                                                            <>
                                                                Configuration en cours...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Configurer les frais
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={handleCancelFees}
                                                        disabled={isSubmittingFees}
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </form>

                                            {/* Liste des frais existants */}
                                            {partner?.fees && partner.fees.length > 0 && (
                                                <div className="mt-4">
                                                    <h6 className="fw-semibold mb-3">
                                                        <i className="iconoir-list me-2"></i>
                                                        Frais configurés actuellement
                                                    </h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-bordered table-hover">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>Code</th>
                                                                    <th>Type</th>
                                                                    <th>Transaction</th>
                                                                    <th>Valeur</th>
                                                                    <th>Statut</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {partner.fees.map(fee => (
                                                                    <tr key={fee.id}>
                                                                        <td><code>{fee.code}</code></td>
                                                                        <td>
                                                                            <span className={`badge ${fee.type === 'percentage' ? 'bg-primary-subtle text-primary' : 'bg-secondary-subtle text-secondary'}`}>
                                                                                {fee.type === 'percentage' ? 'Pourcentage' : 'Fixe'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${fee.transaction_type.id === 1 ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning'}`}>
                                                                                {fee.transaction_type.id === 1 ? 'PAYIN' : 'PAYOUT'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="fw-semibold">
                                                                            {fee.value}{fee.type === 'percentage' ? '%' : ' FCFA'}
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${fee.active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                                                {fee.active ? 'Actif' : 'Inactif'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Section Commissions */}
                                <div className="tab-pane p-3" id="commissions" role="tabpanel">
                                    <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title">
                                                Configuration des commissions
                                            </h4>
                                        </div>
                                        <div className="card-body">
                                            {/* Information générale */}
                                            <div className="alert alert-info mb-3">
                                                <i className="iconoir-info-circle me-2"></i>
                                                <strong>Qu'est-ce qu'une commission ?</strong><br />
                                                Une commission représente le montant qu'un partenaire (Admin ou Partner) gagne sur chaque transaction réussie.
                                                Elle est calculée sur la base des frais de transaction configurés.
                                            </div>

                                            <div className="mb-4">
                                                <h6 className="fw-semibold mb-2">
                                                    <i className="iconoir-help-circle me-2"></i>
                                                    Comment configurer les commissions ?
                                                </h6>
                                                <ul className="mb-0">
                                                    <li className="mb-2">
                                                        <strong>Qui peut recevoir des commissions ?</strong><br />
                                                        Seuls les partenaires avec les rôles <span className="badge bg-danger-subtle text-danger">Admin</span> ou
                                                        <span className="badge bg-primary-subtle text-primary ms-1">Partner</span> peuvent percevoir des commissions.
                                                    </li>
                                                    <li className="mb-2">
                                                        <strong>Valeur de la commission :</strong><br />
                                                        Le montant ou pourcentage que le partenaire gagnera sur chaque transaction.
                                                        La valeur doit être inférieure ou égale au frais de transaction associé.
                                                    </li>
                                                    <li className="mb-2">
                                                        <strong>Partenaire bénéficiaire :</strong><br />
                                                        Le partenaire qui recevra cette commission sur les transactions effectuées via vos services.
                                                    </li>
                                                    <li className="mb-2">
                                                        <strong>Type de frais :</strong><br />
                                                        Les frais de transaction sur lesquels la commission sera calculée (ex: frais PAYIN à 2.5%, commission de 0.5%).
                                                    </li>
                                                </ul>
                                            </div>

                                            {/* Formulaire de configuration */}
                                            <form onSubmit={handleSubmitCommission}>
                                                <div className="row">
                                                    {/* Partenaire bénéficiaire */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-semibold">
                                                            Partenaire bénéficiaire <span className="text-danger">*</span>
                                                        </label>
                                                        <select
                                                            className={`form-select ${commissionErrors.partner_id ? 'is-invalid' : ''}`}
                                                            name="partner_id"
                                                            value={commissionFormData.partner_id}
                                                            onChange={handleCommissionInputChange}
                                                        >
                                                            <option value="">Sélectionner un partenaire</option>
                                                            {eligiblePartners.map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.name} - {p.email}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {commissionErrors.partner_id && (
                                                            <div className="invalid-feedback d-block">
                                                                {commissionErrors.partner_id}
                                                            </div>
                                                        )}
                                                        <small className="text-muted">Seuls les Admin et Partner sont éligibles</small>
                                                    </div>

                                                    {/* Type de frais */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-semibold">
                                                            Type de frais de transaction <span className="text-danger">*</span>
                                                        </label>
                                                        <select
                                                            className={`form-select ${commissionErrors.fees_id ? 'is-invalid' : ''}`}
                                                            name="fees_id"
                                                            value={commissionFormData.fees_id}
                                                            onChange={handleCommissionInputChange}
                                                        >
                                                            <option value="">Sélectionner un type de frais</option>
                                                            {availableFees.map(fee => (
                                                                <option key={fee.id} value={fee.id}>
                                                                    {fee.code} - {fee.value}{fee.type === 'percentage' ? '%' : ' FCFA'}
                                                                    ({fee.transaction_type.name})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {commissionErrors.fees_id && (
                                                            <div className="invalid-feedback d-block">
                                                                {commissionErrors.fees_id}
                                                            </div>
                                                        )}
                                                        <small className="text-muted">
                                                            {availableFees.length === 0 ? (
                                                                <span className="text-warning">
                                                                    <i className="iconoir-warning-triangle me-1"></i>
                                                                    Aucun frais configuré. Veuillez d'abord configurer des frais dans l'onglet "Frais".
                                                                </span>
                                                            ) : (
                                                                'Choisir les frais sur lesquels la commission sera calculée'
                                                            )}
                                                        </small>
                                                    </div>

                                                    {/* Valeur de la commission */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label fw-semibold">
                                                            Valeur de la commission <span className="text-danger">*</span>
                                                        </label>
                                                        <div className="input-group">
                                                            <input
                                                                type="text"
                                                                className={`form-control ${commissionErrors.value ? 'is-invalid' : ''}`}
                                                                placeholder="Ex: 0.5"
                                                                name="value"
                                                                value={commissionFormData.value}
                                                                onChange={handleCommissionInputChange}
                                                            />
                                                            <span className="input-group-text">
                                                                {commissionFormData.fees_id ?
                                                                    (availableFees.find(f => f.id === parseInt(commissionFormData.fees_id))?.type === 'percentage' ? '%' : 'FCFA')
                                                                    : ''
                                                                }
                                                            </span>
                                                            {commissionErrors.value && (
                                                                <div className="invalid-feedback d-block">
                                                                    {commissionErrors.value}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <small className="text-muted">
                                                            {commissionFormData.fees_id ?
                                                                `Doit être ≤ ${availableFees.find(f => f.id === parseInt(commissionFormData.fees_id))?.value || 0}${availableFees.find(f => f.id === parseInt(commissionFormData.fees_id))?.type === 'percentage' ? '%' : ' FCFA'}`
                                                                : 'Nombres et virgules autorisés (ex: 0,5 ou 0.5)'
                                                            }
                                                        </small>
                                                    </div>
                                                </div>

                                                {/* Aperçu de la configuration */}
                                                {commissionFormData.value && commissionFormData.partner_id && commissionFormData.fees_id && (
                                                    <div className="alert alert-success mb-3">
                                                        <h6 className="fw-semibold mb-2">
                                                            <i className="iconoir-eye me-2"></i>
                                                            Aperçu de la commission
                                                        </h6>
                                                        <p className="mb-0">
                                                            <strong>Bénéficiaire :</strong> {eligiblePartners.find(p => p.id === parseInt(commissionFormData.partner_id))?.name}<br />
                                                            <strong>Type de frais :</strong> {availableFees.find(f => f.id === parseInt(commissionFormData.fees_id))?.code}<br />
                                                            <strong>Commission :</strong> <span className="text-success fw-bold">
                                                                {commissionFormData.value}{availableFees.find(f => f.id === parseInt(commissionFormData.fees_id))?.type === 'percentage' ? '%' : ' FCFA'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Boutons */}
                                                <div className="d-flex gap-2">
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        disabled={isSubmittingCommission || availableFees.length === 0}
                                                    >
                                                        {isSubmittingCommission ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                Configuration en cours...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Configurer la commission
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={handleCancelCommission}
                                                        disabled={isSubmittingCommission}
                                                    >
                                                        Annuler
                                                    </button>
                                                </div>
                                            </form>

                                            {/* Liste des commissions existantes */}
                                            {partner?.commissions && partner.commissions.length > 0 && (
                                                <div className="mt-4">
                                                    <h6 className="fw-semibold mb-3">
                                                        <i className="iconoir-list me-2"></i>
                                                        Commissions configurées actuellement
                                                    </h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-bordered table-hover">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>Partenaire bénéficiaire</th>
                                                                    <th>Type de frais</th>
                                                                    <th>Transaction</th>
                                                                    <th>Commission</th>
                                                                    <th>Statut</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {partner.commissions.map(commission => (
                                                                    <tr key={commission.id}>
                                                                        <td>
                                                                            <div className="d-flex flex-column">
                                                                                <span className="fw-semibold">{commission.fee?.partner?.name || 'N/A'}</span>
                                                                                <small className="text-muted">{commission.fee?.partner?.email || ''}</small>
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <code>{commission.fee?.code || 'N/A'}</code><br />
                                                                            <small className="text-muted">
                                                                                {commission.fee?.value}{commission.fee?.type === 'percentage' ? '%' : ' FCFA'}
                                                                            </small>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${commission.fee?.transaction_type?.id === 1 ? 'bg-info-subtle text-info' : 'bg-warning-subtle text-warning'}`}>
                                                                                {commission.fee?.transaction_type?.name || 'N/A'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="fw-semibold text-success">
                                                                            {commission.value}{commission.fee?.type === 'percentage' ? '%' : ' FCFA'}
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
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Section Webhook */}
                                <div className="tab-pane p-3" id="webhooks" role="tabpanel">
                                    <div className="card">
                                        <div className="card-header">
                                            <h4 className="card-title">
                                                Configuration des webhook
                                            </h4>
                                        </div>
                                        <div className="card-body">
                                            {/* Information générale */}
                                            <div className="alert alert-info mb-3">
                                                <i className="iconoir-info-circle me-2"></i>
                                                <strong>Qu'est-ce qu'un webhook ?</strong><br />
                                                Un webhook est une URL de callback HTTP qui permet à notre système de notifier automatiquement le SI du partenaire en temps réel lors d'événements spécifiques (transaction réussie, échouée, en attente, etc.).
                                                Lorsqu'un événement se produit, nous envoyons une requête POST contenant les détails de la transaction vers l'URL que vous avez configurée.
                                            </div>
                                            {/* Liste des webhooks existants */}
                                            <div className="mb-4">
                                                <h5 className="mb-3">
                                                    <i className="iconoir-list me-2"></i>
                                                    Webhooks configurés
                                                </h5>

                                                {loadingWebhooks ? (
                                                    <div className="text-center py-4">
                                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                            <Loader />
                                                        </div>
                                                    </div>
                                                ) : partnerWebhooks.length === 0 ? (
                                                    <div className="alert alert-light border text-center py-4">
                                                        <i className="iconoir-warning-triangle fs-1 text-muted mb-2"></i>
                                                        <p className="mb-0 text-muted">Aucun webhook configuré pour le moment</p>
                                                    </div>
                                                ) : (
                                                    <div className="table-responsive">
                                                        <table className="table table-hover align-middle">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>Nom</th>
                                                                    <th>Événement</th>
                                                                    <th>URL</th>
                                                                    <th>Statut</th>
                                                                    <th>Timeout</th>
                                                                    <th>Tentatives</th>
                                                                    <th>Date de création</th>
                                                                    <th className="text-end">Actions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {partnerWebhooks.map((webhook) => (
                                                                    <tr key={webhook.id}>
                                                                        <td>
                                                                            <strong>{webhook.name}</strong>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${webhook.events === 'success' ? 'bg-success' :
                                                                                webhook.events === 'failed' ? 'bg-danger' :
                                                                                    'bg-warning'
                                                                                }`}>
                                                                                {webhook.events === 'success' && 'Succès'}
                                                                                {webhook.events === 'failed' && 'Échec'}
                                                                                {webhook.events === 'pending' && 'En attente'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <small className="text-muted text-break" style={{ maxWidth: '200px', display: 'inline-block' }}>
                                                                                {webhook.url}
                                                                            </small>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${webhook.enabled ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                                                                                {webhook.enabled ? 'Actif' : 'Inactif'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <small className="text-muted">{webhook.timeout} ms</small>
                                                                        </td>
                                                                        <td>
                                                                            <small className="text-muted">
                                                                                {webhook.retries}/{webhook.max_retries}
                                                                            </small>
                                                                        </td>
                                                                        <td>
                                                                            <small className="text-muted">
                                                                                {new Date(webhook.created_at).toLocaleDateString('fr-FR', {
                                                                                    day: '2-digit',
                                                                                    month: '2-digit',
                                                                                    year: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}
                                                                            </small>
                                                                        </td>
                                                                        <td className="text-end d-flex gap-2">
                                                                            <button
                                                                                className="btn btn-sm btn-outline-danger"
                                                                                onClick={() => handleOpenDeleteWebhookModal(webhook)}
                                                                                title="Supprimer"
                                                                            >
                                                                                <i className="iconoir-trash"></i>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Séparateur */}
                                            <hr className="my-4" />

                                            {/* Titre pour le formulaire */}
                                            <h5 className="mb-3">
                                                <i className="iconoir-plus-circle me-2"></i>
                                                Ajouter un nouveau webhook
                                            </h5>

                                            {/* Formulaire de configuration du webhook */}
                                            <form onSubmit={handleSubmitWebhook}>
                                                <div className="row">
                                                    {/* Nom du webhook */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">
                                                            Nom du webhook <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${webhookErrors.name ? 'is-invalid' : ''}`}
                                                            name="name"
                                                            value={webhookFormData.name}
                                                            onChange={handleWebhookInputChange}
                                                            placeholder="Ex: Notification transaction success"
                                                        />
                                                        {webhookErrors.name && (
                                                            <div className="invalid-feedback">{webhookErrors.name}</div>
                                                        )}
                                                    </div>

                                                    {/* Événement */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">
                                                            Événement <span className="text-danger">*</span>
                                                        </label>
                                                        <select
                                                            className={`form-select ${webhookErrors.events ? 'is-invalid' : ''}`}
                                                            name="events"
                                                            value={webhookFormData.events}
                                                            onChange={handleWebhookInputChange}
                                                        >
                                                            <option value="success">Succès</option>
                                                            <option value="failed">Échec</option>
                                                            <option value="pending">En attente</option>
                                                        </select>
                                                        {webhookErrors.events && (
                                                            <div className="invalid-feedback">{webhookErrors.events}</div>
                                                        )}
                                                    </div>

                                                    {/* URL du webhook */}
                                                    <div className="col-12 mb-3">
                                                        <label className="form-label">
                                                            URL du webhook <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${webhookErrors.url ? 'is-invalid' : ''}`}
                                                            name="url"
                                                            value={webhookFormData.url}
                                                            onChange={handleWebhookInputChange}
                                                            placeholder="https://api.partenaire.com/webhooks/orionpay/transactions"
                                                        />
                                                        {webhookErrors.url && (
                                                            <div className="invalid-feedback">{webhookErrors.url}</div>
                                                        )}
                                                        <small className="text-muted">
                                                            L'URL où les notifications seront envoyées
                                                        </small>
                                                    </div>

                                                    {/* Secret */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">
                                                            Secret <span className="text-muted">(optionnel)</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            name="secret"
                                                            value={webhookFormData.secret}
                                                            onChange={handleWebhookInputChange}
                                                            placeholder="Clé secrète pour signer les requêtes"
                                                        />
                                                        <small className="text-muted">
                                                            Utilisé pour sécuriser et vérifier l'authenticité des requêtes
                                                        </small>
                                                    </div>

                                                    {/* Type de contenu */}
                                                    <div className="col-md-6 mb-3">
                                                        <label className="form-label">
                                                            Type de contenu <span className="text-muted">(optionnel)</span>
                                                        </label>
                                                        <select
                                                            className="form-select"
                                                            name="content_type"
                                                            value={webhookFormData.content_type}
                                                            onChange={handleWebhookInputChange}
                                                        >
                                                            <option value="application/json">application/json</option>
                                                            <option value="application/x-www-form-urlencoded">application/x-www-form-urlencoded</option>
                                                        </select>
                                                    </div>

                                                    {/* Headers personnalisés */}
                                                    <div className="col-12 mb-3">
                                                        <label className="form-label">
                                                            En-têtes personnalisés <span className="text-muted">(optionnel)</span>
                                                        </label>
                                                        <textarea
                                                            className="form-control"
                                                            name="headers"
                                                            value={webhookFormData.headers}
                                                            onChange={handleWebhookInputChange}
                                                            placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
                                                            rows="2"
                                                        />
                                                        <small className="text-muted">
                                                            Format JSON pour les en-têtes HTTP personnalisés
                                                        </small>
                                                    </div>

                                                    {/* Timeout */}
                                                    <div className="col-md-4 mb-3">
                                                        <label className="form-label">
                                                            Délai d'expiration (ms) <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${webhookErrors.timeout ? 'is-invalid' : ''}`}
                                                            name="timeout"
                                                            value={webhookFormData.timeout}
                                                            onChange={handleWebhookInputChange}
                                                            placeholder="30000"
                                                        />
                                                        {webhookErrors.timeout && (
                                                            <div className="invalid-feedback">{webhookErrors.timeout}</div>
                                                        )}
                                                        <small className="text-muted">
                                                            Temps maximum d'attente de réponse (en millisecondes)
                                                        </small>
                                                    </div>

                                                    {/* Nombre maximum de tentatives */}
                                                    <div className="col-md-4 mb-3">
                                                        <label className="form-label">
                                                            Tentatives maximum <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${webhookErrors.max_retries ? 'is-invalid' : ''}`}
                                                            name="max_retries"
                                                            value={webhookFormData.max_retries}
                                                            onChange={handleWebhookInputChange}
                                                            placeholder="5"
                                                        />
                                                        {webhookErrors.max_retries && (
                                                            <div className="invalid-feedback">{webhookErrors.max_retries}</div>
                                                        )}
                                                        <small className="text-muted">
                                                            Nombre de tentatives en cas d'échec
                                                        </small>
                                                    </div>

                                                    {/* Délai entre les tentatives */}
                                                    <div className="col-md-4 mb-3">
                                                        <label className="form-label">
                                                            Délai entre tentatives (ms) <span className="text-danger">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className={`form-control ${webhookErrors.retry_delay ? 'is-invalid' : ''}`}
                                                            name="retry_delay"
                                                            value={webhookFormData.retry_delay}
                                                            onChange={handleWebhookInputChange}
                                                            placeholder="2000"
                                                        />
                                                        {webhookErrors.retry_delay && (
                                                            <div className="invalid-feedback">{webhookErrors.retry_delay}</div>
                                                        )}
                                                        <small className="text-muted">
                                                            Temps d'attente entre chaque tentative (en millisecondes)
                                                        </small>
                                                    </div>

                                                    {/* Paramètres personnalisés */}
                                                    <div className="col-12 mb-3">
                                                        <label className="form-label">
                                                            Paramètres personnalisés <span className="text-muted">(optionnel)</span>
                                                        </label>
                                                        <textarea
                                                            className="form-control"
                                                            name="custom_parameters"
                                                            value={webhookFormData.custom_parameters}
                                                            onChange={handleWebhookInputChange}
                                                            placeholder='{"merchant_id": "12345", "custom_field": "value"}'
                                                            rows="2"
                                                        />
                                                        <small className="text-muted">
                                                            Format JSON pour des paramètres additionnels à inclure dans la requête
                                                        </small>
                                                    </div>
                                                </div>

                                                {/* Aperçu de la configuration */}
                                                <div className="alert alert-light border mb-3">
                                                    <h6 className="mb-2">
                                                        <i className="iconoir-eye me-2"></i>
                                                        Aperçu de la configuration
                                                    </h6>
                                                    <div className="row g-2">
                                                        <div className="col-md-6">
                                                            <small className="text-muted d-block">Nom</small>
                                                            <strong>{webhookFormData.name || '-'}</strong>
                                                        </div>
                                                        <div className="col-md-6">
                                                            <small className="text-muted d-block">Événement</small>
                                                            <strong>
                                                                {webhookFormData.events === 'success' && 'Succès'}
                                                                {webhookFormData.events === 'failed' && 'Échec'}
                                                                {webhookFormData.events === 'pending' && 'En attente'}
                                                            </strong>
                                                        </div>
                                                        <div className="col-12">
                                                            <small className="text-muted d-block">URL</small>
                                                            <strong className="text-break">{webhookFormData.url || '-'}</strong>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <small className="text-muted d-block">Timeout</small>
                                                            <strong>{webhookFormData.timeout ? `${webhookFormData.timeout} ms` : '-'}</strong>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <small className="text-muted d-block">Max tentatives</small>
                                                            <strong>{webhookFormData.max_retries || '-'}</strong>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <small className="text-muted d-block">Délai tentatives</small>
                                                            <strong>{webhookFormData.retry_delay ? `${webhookFormData.retry_delay} ms` : '-'}</strong>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Boutons d'action */}
                                                <div className="d-flex justify-content-end gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary"
                                                        onClick={handleCancelWebhook}
                                                        disabled={isSubmittingWebhook}
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="btn btn-primary"
                                                        disabled={isSubmittingWebhook}
                                                    >
                                                        {isSubmittingWebhook ? (
                                                            <>
                                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                Configuration du webhook en cours...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Configurer le webhook
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </form>

                                            {/* Modal de confirmation de suppression */}
                                            {showDeleteWebhookModal && (
                                                <>
                                                    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" role="dialog">
                                                        <div className="modal-dialog modal-dialog-centered" role="document">
                                                            <div className="modal-content">
                                                                <div className="modal-header bg-danger-subtle">
                                                                    <h5 className="modal-title text-danger">
                                                                        <i className="iconoir-warning-triangle text-danger me-2"></i>
                                                                        Confirmer la suppression
                                                                    </h5>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-close"
                                                                        onClick={handleCloseDeleteWebhookModal}
                                                                        disabled={isDeletingWebhook}
                                                                        aria-label="Close"
                                                                    ></button>
                                                                </div>
                                                                <div className="modal-body">
                                                                    <p className="mb-2">
                                                                        Êtes-vous sûr de vouloir supprimer le webhook <strong>"{webhookToDelete?.name}"</strong> ?
                                                                    </p>
                                                                    <div className="alert alert-warning mb-0">
                                                                        <i className="iconoir-info-circle me-2"></i>
                                                                        <small>
                                                                            Cette action est irréversible. Le webhook ne recevra plus de notifications après sa suppression.
                                                                        </small>
                                                                    </div>
                                                                </div>
                                                                <div className="modal-footer">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-secondary"
                                                                        onClick={handleCloseDeleteWebhookModal}
                                                                        disabled={isDeletingWebhook}
                                                                    >
                                                                        Annuler
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-danger"
                                                                        onClick={handleDeleteWebhook}
                                                                        disabled={isDeletingWebhook}
                                                                    >
                                                                        {isDeletingWebhook ? (
                                                                            <>
                                                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                                                Suppression en cours...
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <i className="iconoir-trash me-2"></i>
                                                                                Supprimer
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="modal-backdrop fade show"></div>
                                                </>
                                            )}



                                        </div>
                                    </div>
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
                {/* Modal de confirmation de blocage */}
                {showBlockModal && (
                    <>
                        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" role="dialog">
                            <div className="modal-dialog modal-dialog-centered" role="document">
                                <div className="modal-content">
                                    <div className="modal-header bg-danger-subtle">
                                        <h5 className="modal-title text-danger">
                                            <i className="iconoir-warning-triangle text-danger me-2"></i>
                                            Confirmer le blocage du partenaire
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={handleCloseBlockModal}
                                            disabled={isBlockingPartner}
                                            aria-label="Close"
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        <p className="mb-3">
                                            Êtes-vous sûr de vouloir bloquer le partenaire <strong>"{partner?.name}"</strong> ?
                                        </p>
                                        <div className="alert alert-danger mb-3">
                                            <h6 className="alert-heading mb-2">
                                                <i className="iconoir-warning-triangle me-2"></i>
                                                Conséquences du blocage :
                                            </h6>
                                            <ul className="mb-0 ps-3">
                                                <li className="mb-2">
                                                    <strong>Accès suspendu :</strong> Le partenaire ne pourra plus se connecter à son compte.
                                                </li>
                                                <li className="mb-2">
                                                    <strong>Transactions bloquées :</strong> Aucune nouvelle transaction ne pourra être effectuée par ce partenaire.
                                                </li>
                                                <li className="mb-2">
                                                    <strong>Services inaccessibles :</strong> Tous les services liés à ce partenaire seront temporairement indisponibles.
                                                </li>
                                                <li className="mb-2">
                                                    <strong>Webhooks désactivés :</strong> Les webhooks configurés ne recevront plus de notifications.
                                                </li>
                                                <li>
                                                    <strong>Réversibilité :</strong> Cette action peut être annulée en débloquant le partenaire ultérieurement.
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="alert alert-info mb-0">
                                            <i className="iconoir-info-circle me-2"></i>
                                            <small>
                                                Le partenaire sera notifié de cette action. Vous pourrez le débloquer à tout moment depuis cette page.
                                            </small>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCloseBlockModal}
                                            disabled={isBlockingPartner}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger"
                                            onClick={handleConfirmBlockPartner}
                                            disabled={isBlockingPartner}
                                        >
                                            {isBlockingPartner ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Blocage en cours...
                                                </>
                                            ) : (
                                                <>

                                                    Confirmer le blocage
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-backdrop fade show"></div>
                    </>
                )}
                {/* Modal de confirmation de déblocage */}
                {showUnblockModal && (
                    <>
                        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" role="dialog">
                            <div className="modal-dialog modal-dialog-centered" role="document">
                                <div className="modal-content">
                                    <div className="modal-header bg-success-subtle">
                                        <h5 className="modal-title text-success">
                                            Confirmer le déblocage du partenaire
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={handleCloseUnblockModal}
                                            disabled={isUnblockingPartner}
                                            aria-label="Close"
                                        ></button>
                                    </div>
                                    <div className="modal-body">
                                        <p className="mb-3">
                                            Êtes-vous sûr de vouloir débloquer le partenaire <strong>"{partner?.name}"</strong> ?
                                        </p>
                                        <div className="alert alert-success mb-3">
                                            <h6 className="alert-heading mb-2">
                                                <i className="iconoir-check-circle me-2"></i>
                                                Conséquences du déblocage :
                                            </h6>
                                            <ul className="mb-0 ps-3">
                                                <li className="mb-2">
                                                    <strong>Accès rétabli :</strong> Le partenaire pourra à nouveau se connecter à son compte.
                                                </li>
                                                <li className="mb-2">
                                                    <strong>Transactions autorisées :</strong> Les transactions pourront être effectuées par ce partenaire.
                                                </li>
                                                <li className="mb-2">
                                                    <strong>Services accessibles :</strong> Tous les services liés à ce partenaire seront à nouveau disponibles.
                                                </li>
                                                <li className="mb-2">
                                                    <strong>Webhooks activés :</strong> Les webhooks configurés recevront à nouveau des notifications.
                                                </li>
                                                <li>
                                                    <strong>Réversibilité :</strong> Cette action peut être annulée en bloquant le partenaire à nouveau.
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="alert alert-info mb-0">
                                            <i className="iconoir-info-circle me-2"></i>
                                            <small>
                                                Le partenaire sera notifié de cette action. Vous pourrez le bloquer à tout moment depuis cette page.
                                            </small>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCloseUnblockModal}
                                            disabled={isUnblockingPartner}
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-success"
                                            onClick={handleUnblockPartner}
                                            disabled={isUnblockingPartner}
                                        >
                                            {isUnblockingPartner ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Déblocage en cours...
                                                </>
                                            ) : (
                                                <>
                                                    Confirmer le déblocage
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-backdrop fade show"></div>
                    </>
                )}
            </div>
        </Layout>
    )
}
