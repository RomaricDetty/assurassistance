import React, { useState, useEffect } from 'react'
import { Buffer } from 'buffer';
import { useSelector } from 'react-redux'
import { Link } from 'react-router';
import { getAllPartners, createPartner } from '../../config/urls/partners';
import { uploadToS3, uploadFromFtp } from '../../utils/upload-file';
import { sendToastError, sendToastSuccess } from '../../helpers'
import { validateAndCleanImageUrl } from '../../utils'
import { Layout } from '../../components/layout'
import { Footer } from '../../components/footer'
import { Loader } from '../../components/loader'
import Avatar from '../../assets/images/avatar.png'

export const Partners = () => {
    window.Buffer = window.Buffer || Buffer;
    const token = useSelector(state => state.auth.token)
    const [partners, setPartners] = useState([])
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPreviousPage: false
    })
    // Ajouter ces nouveaux states
    const [selectedPartner, setSelectedPartner] = useState(null)
    const [showCommissionsModal, setShowCommissionsModal] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        zip_code: '',
        password: '',
        confirm_password: '',
        logo: null,
        role_id: ''
    })
    const [logoPreview, setLogoPreview] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    // States pour les filtres - Séparés en deux catégories
    const [filters, setFilters] = useState({
        // Filtres instantanés (selects)
        role_id: '',
        active: '',
        sortBy: 'created_at',
        order: 'DESC'
    })

    // Filtres avec debounce (champs texte)
    const [textFilters, setTextFilters] = useState({
        search: '',
        country: '',
        city: ''
    })

    // Filtres appliqués (ceux envoyés à l'API)
    const [appliedTextFilters, setAppliedTextFilters] = useState({
        search: '',
        country: '',
        city: ''
    })

    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setAppliedTextFilters(textFilters)
        }, 500)

        return () => clearTimeout(timer)
    }, [textFilters])

    // Fonction pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        const date = new Date(dateString)
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    // Fonction pour récupérer les partenaires avec filtres
    const fetchPartners = async (page = 1) => {
        try {
            setLoading(true)
            setIsSearching(true)

            // Construire les query params
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            })

            // Ajouter les filtres texte appliqués (après debounce)
            if (appliedTextFilters.search && appliedTextFilters.search.trim() !== '') {
                queryParams.append('search', appliedTextFilters.search.trim())
            }
            if (appliedTextFilters.country && appliedTextFilters.country.trim() !== '') {
                queryParams.append('country', appliedTextFilters.country.trim())
            }
            if (appliedTextFilters.city && appliedTextFilters.city.trim() !== '') {
                queryParams.append('city', appliedTextFilters.city.trim())
            }

            // Ajouter les filtres select (instantanés)
            if (filters.role_id && filters.role_id !== '') {
                queryParams.append('role_id', filters.role_id)
            }
            if (filters.active && filters.active !== '') {
                queryParams.append('active', filters.active)
            }
            if (filters.sortBy && filters.sortBy !== '') {
                queryParams.append('sortBy', filters.sortBy)
            }
            if (filters.order && filters.order !== '') {
                queryParams.append('order', filters.order)
            }

            const response = await fetch(`${getAllPartners}?${queryParams.toString()}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            const result = await response.json()
            if (result.success) {
                setPartners(result.data.partners)
                setPagination(result.data.pagination)
            } else {
                sendToastError('Erreur lors de la récupération des partenaires')
            }
        } catch (error) {
            console.error('Erreur:', error)
            sendToastError('Erreur de connexion au serveur')
        } finally {
            setLoading(false)
            setIsSearching(false)
        }
    }

    // Charger les partenaires au montage du composant
    useEffect(() => {
        fetchPartners(1)
    }, [filters, appliedTextFilters])

    // Fonction pour déterminer le type de compte
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

    // Fonction pour formater les frais et commissions
    const formatFeesAndCommissions = (partner) => {
        const hasFees = partner.fees && partner.fees.length > 0
        const hasCommissions = partner.commissions && partner.commissions.length > 0
        if (!hasFees && !hasCommissions) {
            return <span className="text-muted fs-12">-</span>
        }
        return (
            <div className="d-flex flex-column gap-1">
                {/* Afficher les FRAIS (pour les marchands) */}
                {hasFees && (
                    <div>
                        <div className="text-muted fs-11 fw-bold mb-1">FRAIS :</div>
                        {partner.fees.map((fee) => (
                            <div key={fee.id} className="small mb-1">
                                <span className="badge rounded text-danger bg-danger-subtle">
                                    {fee.type === 'percentage' ? `${fee.value}%` : `${fee.value} FCFA`}
                                </span>
                                <span className="text-muted ms-1 fs-11">
                                    {fee.transaction_type?.name || `Type ${fee.transaction_type_id}`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Afficher les commissions */}
                {hasCommissions && (
                    <div>
                        <div className="d-flex align-items-center gap-2">
                            <div className="text-muted fs-11 fw-bold">COMMISSIONS :</div>
                            <span className="badge rounded text-success bg-success-subtle">
                                {partner.commissions.length}
                            </span>
                        </div>
                        {/* Afficher uniquement la première commission */}
                        {partner.commissions.length > 0 && (
                            <div className="small mb-1">
                                <span className="badge rounded text-success bg-success-subtle">
                                    {partner.commissions[0].fee?.type === 'percentage'
                                        ? `${partner.commissions[0].value}%`
                                        : `${partner.commissions[0].value} FCFA`}
                                </span>
                                <span className="text-muted ms-1 fs-11">
                                    sur {partner.commissions[0].fee?.code || 'N/A'}
                                </span>
                            </div>
                        )}
                        {/* Bouton "Voir plus" si plus d'une commission */}
                        {partner.commissions.length > 1 && (
                            <button
                                className="btn btn-link btn-sm p-0 text-primary fs-11"
                                onClick={() => handleShowCommissions(partner)}
                            >
                                <i className="las la-eye me-1" />
                                Voir plus ({partner.commissions.length - 1} autres)
                            </button>
                        )}
                        {/* Bouton "Voir détails" si une seule commission */}
                        {partner.commissions.length === 1 && (
                            <button
                                className="btn btn-link btn-sm p-0 text-primary fs-11"
                                onClick={() => handleShowCommissions(partner)}
                            >
                                <i className="las la-eye me-1" />
                                Voir détails
                            </button>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // Fonction pour afficher le modal des commissions
    const handleShowCommissions = (partner) => {
        setSelectedPartner(partner)
        setShowCommissionsModal(true)
    }

    // Fonction pour fermer le modal
    const handleCloseCommissionsModal = () => {
        setShowCommissionsModal(false)
        setSelectedPartner(null)
    }

    const getTransactionTypeLabel = (transactionTypeId) => {
        const types = {
            1: 'Payin',
            2: 'Payout',
        }
        return types[transactionTypeId] || `${transactionTypeId}`
    }

    // Fonction pour gérer les changements dans le formulaire
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleLogoChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (!file.type.startsWith('image/')) {
                sendToastError('Veuillez sélectionner une image valide')
                return
            }

            // Vérifier la taille (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                sendToastError('L\'image ne doit pas dépasser 5MB')
                return
            }

            setFormData(prev => ({
                ...prev,
                logo: file
            }))

            // Créer un preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setLogoPreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    // Fonction pour supprimer le logo
    const handleRemoveLogo = () => {
        setFormData(prev => ({
            ...prev,
            logo: null
        }))
        setLogoPreview(null)
    }

    // Fonction pour réinitialiser le formulaire
    const resetForm = () => {
        setFormData({
            name: '',
            firstname: '',
            lastname: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            country: '',
            zip_code: '',
            password: '',
            confirm_password: '',
            logo: null,
            role_id: ''
        })
        setLogoPreview(null)
        setIsSubmitting(false)
    }

    // Fonction pour nettoyer les backdrops Bootstrap
    const cleanupBackdrop = () => {
        // Supprimer les backdrops Bootstrap du DOM
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        
        // Retirer la classe modal-open du body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    // useEffect pour nettoyer le backdrop quand le modal se ferme
    useEffect(() => {
        if (!showAddModal) {
            // Petit délai pour s'assurer que le state est bien mis à jour
            setTimeout(() => {
                cleanupBackdrop();
            }, 100);
        }
    }, [showAddModal]);

    // Fonction pour soumettre la creation d'un partenaire
    const handleSubmitPartner = async (e) => {
        try {
            setIsSubmitting(true)
            e.preventDefault()

            // Validation
            if (!formData.name || !formData.firstname || !formData.lastname || !formData.email || !formData.phone || !formData.password || !formData.role_id) {
                sendToastError('Veuillez remplir tous les champs obligatoires')
                return
            }

            if (formData.password !== formData.confirm_password) {
                sendToastError('Les mots de passe ne correspondent pas')
                return
            }

            if (formData.password.length < 8) {
                sendToastError('Le mot de passe doit contenir au moins 8 caractères')
                return
            }

            let getUrlLogo = await uploadToS3(formData.logo)
            if (!getUrlLogo.success) {
                // uploadToS3 failed, so try uploadFromFtp
                getUrlLogo = await uploadFromFtp(formData.logo)
                if (!getUrlLogo.success) {
                    setLoading(false)
                    sendToastError(getUrlLogo.message)
                    return
                }
            }
            // At this point, getUrlLogo is either the successful S3 or FTP response
            const logoUrl = getUrlLogo?.dataUrl
            const dataToSend = {
                name: formData.name,
                firstname: formData.firstname,
                lastname: formData.lastname,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                country: formData.country,
                zip_code: formData.zip_code,
                password: formData.password,
                confirm_password: formData.confirm_password,
                logo: logoUrl,
                role_id: parseInt(formData.role_id)
            }

            const response = await fetch(`${createPartner}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(dataToSend)
            })
            const result = await response.json()
            if (result.success) {
                setShowAddModal(false)
                cleanupBackdrop() // Nettoyer le backdrop immédiatement
                sendToastSuccess('Partenaire créé avec succès')
                resetForm()
                fetchPartners()
            } else {
                setIsSubmitting(false)
                sendToastError(result.message || 'Erreur lors de la création du partenaire')
            }
        }

        catch (error) {
            console.error('Erreur:', error)
            sendToastError('Erreur lors de la création du partenaire')
            setIsSubmitting(false)
        }
    }

    // Fonction pour changer de page
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchPartners(newPage)
        }
    }

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }))
    }

    // Fonction pour gérer les changements de filtres TEXTE (avec debounce)
    const handleTextFilterChange = (filterName, value) => {
        setTextFilters(prev => ({
            ...prev,
            [filterName]: value
        }))
    }

    // Fonction pour forcer la recherche (optionnel)
    const handleForceSearch = () => {
        setAppliedTextFilters(textFilters)
    }

    // Fonction pour réinitialiser les filtres
    const resetFilters = () => {
        setFilters({
            role_id: '',
            active: '',
            sortBy: 'created_at',
            order: 'DESC'
        })
        setTextFilters({
            search: '',
            country: '',
            city: ''
        })
        setAppliedTextFilters({
            search: '',
            country: '',
            city: ''
        })
    }

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
                                <h4 className="page-title">Partenaires</h4>
                                <div className="">
                                    <ol className="breadcrumb mb-0">
                                        <li className="breadcrumb-item">
                                            <a href="#">OrionPay</a>
                                        </li>
                                        <li className="breadcrumb-item active">Partenaires</li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-header">
                                    <div className="row align-items-center">
                                        <div className="col">
                                            <h4 className="card-title">
                                                Liste des partenaires ({pagination.totalItems})
                                            </h4>
                                        </div>
                                        <div className="col-auto">
                                            <button
                                                className="btn bg-primary text-white"
                                                data-bs-toggle="modal"
                                                data-bs-target="#addUser"
                                            >
                                                <i className="fas fa-plus me-1" /> Ajouter Partenaire
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {/* Section des filtres */}
                                <div className="card-body border-bottom">
                                    <div className="row g-3">
                                        {/* Recherche */}
                                        <div className="col-md-3">
                                            <label className="form-label fs-13">
                                                Recherche
                                                {textFilters.search !== appliedTextFilters.search && (
                                                    <span className="badge bg-warning-subtle text-warning ms-2">
                                                        <i className="fas fa-clock me-1" />
                                                        En attente...
                                                    </span>
                                                )}
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Recherche par nom, email, etc."
                                                    value={textFilters.search}
                                                    onChange={(e) => handleTextFilterChange('search', e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleForceSearch()
                                                        }
                                                    }}
                                                />
                                                {textFilters.search && (
                                                    <button
                                                        className="btn btn-outline-secondary"
                                                        type="button"
                                                        onClick={() => handleTextFilterChange('search', '')}
                                                    >
                                                        <i className="fas fa-times" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Filtre par rôle */}
                                        <div className="col-md-2">
                                            <label className="form-label fs-13">
                                                <i className="fas fa-filter me-1" />
                                                Type
                                            </label>
                                            <select
                                                className="form-select"
                                                value={filters.role_id}
                                                onChange={(e) => handleFilterChange('role_id', e.target.value)}
                                            >
                                                <option value="">Tous les types</option>
                                                <option value="1">Administrateur</option>
                                                <option value="2">Partenaire</option>
                                                <option value="3">Marchand</option>
                                            </select>
                                        </div>

                                        {/* Filtre par statut */}
                                        <div className="col-md-2">
                                            <label className="form-label fs-13">Statut</label>
                                            <select
                                                className="form-select"
                                                value={filters.active}
                                                onChange={(e) => handleFilterChange('active', e.target.value)}
                                            >
                                                <option value="">Tous les statuts</option>
                                                <option value="true">Actif</option>
                                                <option value="false">Bloqué</option>
                                            </select>
                                        </div>

                                        {/* Filtre par pays */}
                                        <div className="col-md-2">
                                            <label className="form-label fs-13">
                                                Pays
                                                {textFilters.country !== appliedTextFilters.country && (
                                                    <span className="badge bg-warning-subtle text-warning ms-2">
                                                        <i className="fas fa-clock me-1" />
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ex: Côte d'Ivoire"
                                                value={textFilters.country}
                                                onChange={(e) => handleTextFilterChange('country', e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleForceSearch()
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Filtre par ville */}
                                        <div className="col-md-2">
                                            <label className="form-label fs-13">
                                                Ville
                                                {textFilters.city !== appliedTextFilters.city && (
                                                    <span className="badge bg-warning-subtle text-warning ms-2">
                                                        <i className="fas fa-clock me-1" />
                                                    </span>
                                                )}
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Ex: Abidjan"
                                                value={textFilters.city}
                                                onChange={(e) => handleTextFilterChange('city', e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleForceSearch()
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Bouton réinitialiser */}
                                        <div className="col-md-1">
                                            <label className="form-label fs-13 opacity-0">Action</label>
                                            <button
                                                className="btn btn-soft-secondary w-100"
                                                onClick={resetFilters}
                                                title="Réinitialiser les filtres"
                                            >
                                                <i className="fas fa-redo" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Ligne de tri + Bouton Rechercher */}
                                    <div className="row g-3 mt-2">
                                        <div className="col-md-3">
                                            <label className="form-label fs-13">Trier par</label>
                                            <select
                                                className="form-select"
                                                value={filters.sortBy}
                                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                            >
                                                <option value="created_at">Date d'inscription</option>
                                                <option value="name">Nom</option>
                                                <option value="email">Email</option>
                                                <option value="id">ID</option>
                                            </select>
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label fs-13">Ordre</label>
                                            <select
                                                className="form-select"
                                                value={filters.order}
                                                onChange={(e) => handleFilterChange('order', e.target.value)}
                                            >
                                                <option value="DESC">Plus récent</option>
                                                <option value="ASC">Plus ancien</option>
                                            </select>
                                        </div>

                                        {/* Bouton Rechercher (optionnel - force la recherche) */}
                                        <div className="col-md-2">
                                            <label className="form-label fs-13 opacity-0">Action</label>
                                            <button
                                                className="btn btn-primary w-100"
                                                onClick={handleForceSearch}
                                                disabled={isSearching || (
                                                    textFilters.search === appliedTextFilters.search &&
                                                    textFilters.country === appliedTextFilters.country &&
                                                    textFilters.city === appliedTextFilters.city
                                                )}
                                            >
                                                {isSearching ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" />
                                                        Recherche...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="fas fa-search me-2" />
                                                        Rechercher
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {/* Indicateur de filtres actifs */}
                                        <div className="col-md-5 d-flex align-items-end">
                                            {(appliedTextFilters.search || filters.role_id || filters.active || appliedTextFilters.country || appliedTextFilters.city) && (
                                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                                    <span className="text-muted fs-13">Filtres actifs :</span>
                                                    {appliedTextFilters.search && (
                                                        <span className="badge bg-primary-subtle text-primary">
                                                            Recherche: {appliedTextFilters.search}
                                                            <i
                                                                className="fas fa-times ms-1 cursor-pointer"
                                                                onClick={() => {
                                                                    handleTextFilterChange('search', '')
                                                                    setAppliedTextFilters(prev => ({ ...prev, search: '' }))
                                                                }}
                                                            />
                                                        </span>
                                                    )}
                                                    {filters.role_id && (
                                                        <span className="badge bg-info-subtle text-info">
                                                            Type: {filters.role_id === '1' ? 'Admin' : filters.role_id === '2' ? 'Partenaire' : 'Marchand'}
                                                            <i
                                                                className="fas fa-times ms-1 cursor-pointer"
                                                                onClick={() => handleFilterChange('role_id', '')}
                                                            />
                                                        </span>
                                                    )}
                                                    {filters.active && (
                                                        <span className="badge bg-success-subtle text-success">
                                                            Statut: {filters.active === 'true' ? 'Actif' : 'Bloqué'}
                                                            <i
                                                                className="fas fa-times ms-1 cursor-pointer"
                                                                onClick={() => handleFilterChange('active', '')}
                                                            />
                                                        </span>
                                                    )}
                                                    {appliedTextFilters.country && (
                                                        <span className="badge bg-warning-subtle text-warning">
                                                            Pays: {appliedTextFilters.country}
                                                            <i
                                                                className="fas fa-times ms-1 cursor-pointer"
                                                                onClick={() => {
                                                                    handleTextFilterChange('country', '')
                                                                    setAppliedTextFilters(prev => ({ ...prev, country: '' }))
                                                                }}
                                                            />
                                                        </span>
                                                    )}
                                                    {appliedTextFilters.city && (
                                                        <span className="badge bg-secondary-subtle text-secondary">
                                                            Ville: {appliedTextFilters.city}
                                                            <i
                                                                className="fas fa-times ms-1 cursor-pointer"
                                                                onClick={() => {
                                                                    handleTextFilterChange('city', '')
                                                                    setAppliedTextFilters(prev => ({ ...prev, city: '' }))
                                                                }}
                                                            />
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body pt-0">
                                    <div className="table-responsive">
                                        <table className="table mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Nom</th>
                                                    <th>Email</th>
                                                    <th>Téléphone</th>
                                                    <th>Date d'inscription</th>
                                                    <th>Type de compte</th>
                                                    <th>Frais/Commissions (par type de transaction)</th>
                                                    <th>Dernier accès</th>
                                                    <th>Statut</th>
                                                    <th className="text-end">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {partners.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="9" className="text-center py-4">
                                                            Aucun partenaire trouvé
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    partners.map((partner) => (
                                                        <tr key={partner.id}>
                                                            <td>
                                                                <div className="d-flex align-items-center">
                                                                    <img
                                                                        src={validateAndCleanImageUrl(partner.logo, Avatar)}
                                                                        className="me-2 thumb-md align-self-center rounded"
                                                                        alt={partner.name}
                                                                    />
                                                                    <div className="flex-grow-1 text-truncate">
                                                                        <h6 className="m-0">
                                                                            {partner.name}
                                                                        </h6>
                                                                        <p className="fs-12 text-muted mb-0">
                                                                            {partner.country || partner.city || 'N/A'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <a href={`mailto:${partner.email}`} className="text-body text-decoration-underline">
                                                                    {partner.email}
                                                                </a>
                                                            </td>
                                                            <td>{partner.phone || 'N/A'}</td>
                                                            <td>{formatDate(partner.created_at)}</td>
                                                            <td>{getAccountTypeBadge(partner.role?.name)}</td>
                                                            <td>{formatFeesAndCommissions(partner)}</td>
                                                            <td>
                                                                {partner.last_access
                                                                    ? formatDate(partner.last_access)
                                                                    : <span className="text-muted">Jamais</span>
                                                                }
                                                            </td>
                                                            <td>
                                                                {partner.active ? (
                                                                    <span className="badge rounded text-success bg-success-subtle">
                                                                        Actif
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge rounded text-danger bg-danger-subtle">
                                                                        Bloqué
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="text-end">
                                                                {/* <a href="#" title="Modifier">
                                                                    <i className="las la-pen text-secondary fs-18" />
                                                                </a> */}
                                                                <Link to={`/partners/details/${partner.id}`} title="Voir les détails" className="ms-2">
                                                                    <i className="las la-eye text-secondary fs-18" />
                                                                </Link>
                                                                {/* <a href="#" title="Supprimer" className="ms-2">
                                                                <i className="las la-trash-alt text-secondary fs-18" />
                                                                </a> */}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination */}
                                    {pagination.totalPages > 1 && (
                                        <div className="row mt-3">
                                            <div className="col-sm-12 col-md-5">
                                                <div className="datatable-info" role="status" aria-live="polite">
                                                    Affichage de {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} à {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} sur {pagination.totalItems} entrées
                                                </div>
                                            </div>
                                            <div className="col-sm-12 col-md-7">
                                                <div className="datatable-pagination">
                                                    <ul className="datatable-pagination-list">
                                                        {/* Bouton Précédent */}
                                                        <li className={`datatable-pagination-list-item ${!pagination.hasPreviousPage ? 'datatable-disabled' : ''}`}>
                                                            <button
                                                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                                                disabled={!pagination.hasPreviousPage}
                                                                className="datatable-pagination-list-item-link"
                                                            >
                                                                ‹
                                                            </button>
                                                        </li>

                                                        {/* Numéros de pages */}
                                                        {[...Array(pagination.totalPages)].map((_, index) => {
                                                            const pageNumber = index + 1
                                                            return (
                                                                <li
                                                                    key={pageNumber}
                                                                    className={`datatable-pagination-list-item ${pagination.currentPage === pageNumber ? 'datatable-active' : ''}`}
                                                                >
                                                                    <button
                                                                        onClick={() => handlePageChange(pageNumber)}
                                                                        className="datatable-pagination-list-item-link"
                                                                    >
                                                                        {pageNumber}
                                                                    </button>
                                                                </li>
                                                            )
                                                        })}

                                                        {/* Bouton Suivant */}
                                                        <li className={`datatable-pagination-list-item ${!pagination.hasNextPage ? 'datatable-disabled' : ''}`}>
                                                            <button
                                                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                                                disabled={!pagination.hasNextPage}
                                                                className="datatable-pagination-list-item-link"
                                                            >
                                                                ›
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Ajouter Partenaire */}

                <div
                    className={`modal fade ${showAddModal ? 'show' : ''}`}
                    id="addUser"
                    tabIndex={-1}
                    aria-labelledby="addUserLabel"
                    aria-hidden={!showAddModal}
                    style={{ display: showAddModal ? 'block' : 'none' }}
                >
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleSubmitPartner}>
                                <div className="modal-header">
                                    <h5 className="modal-title" id="addUserLabel">
                                        Ajouter un partenaire
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        data-bs-dismiss="modal"
                                        aria-label="Close"
                                        onClick={() => {
                                            resetForm()
                                            cleanupBackdrop()
                                        }}
                                    />
                                </div>
                                <div className="modal-body">
                                    {/* Logo avec preview */}
                                    <div className="form-group mb-3">
                                        <label className="form-label">Logo</label>
                                        <div className="d-flex align-items-center gap-3">
                                            {logoPreview ? (
                                                <div className="position-relative">
                                                    <img
                                                        src={logoPreview}
                                                        alt="Preview"
                                                        className="rounded"
                                                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm position-absolute top-0 end-0"
                                                        style={{ transform: 'translate(25%, -25%)' }}
                                                        onClick={handleRemoveLogo}
                                                    >
                                                        <i className="fas fa-times" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="d-flex align-items-center justify-content-center border border-dashed rounded" style={{ width: '100px', height: '100px' }}>
                                                    <i className="fas fa-image text-muted fs-24" />
                                                </div>
                                            )}
                                            <div className="flex-grow-1">
                                                <label className="btn btn-primary text-light">
                                                    <i className="fas fa-upload me-2" />
                                                    {logoPreview ? 'Changer le logo' : 'Ajouter un logo'}
                                                    <input
                                                        type="file"
                                                        hidden
                                                        accept="image/*"
                                                        onChange={handleLogoChange}
                                                    />
                                                </label>
                                                <p className="text-muted fs-12 mb-0 mt-2">
                                                    Format: JPG, PNG, GIF (Max: 5MB)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nom de l'entreprise */}
                                    <div className="mb-3">
                                        <label htmlFor="name" className="form-label">
                                            Nom de l'entreprise <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="fas fa-building" />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="name"
                                                name="name"
                                                placeholder="Ex: Black Mirror SARL"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Prénom et Nom */}
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="firstname" className="form-label">
                                                    Prénom du représentant <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="far fa-user" />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="firstname"
                                                        name="firstname"
                                                        placeholder="Prénom du représentant"
                                                        value={formData.firstname}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="lastname" className="form-label">
                                                    Nom du représentant <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="far fa-user" />
                                                    </span>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="lastname"
                                                        name="lastname"
                                                        placeholder="Nom du représentant"
                                                        value={formData.lastname}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Email et Téléphone */}
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="email" className="form-label">
                                                    Email <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="far fa-envelope" />
                                                    </span>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        id="email"
                                                        name="email"
                                                        placeholder="exemple@email.com"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="phone" className="form-label">
                                                    Téléphone <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="fas fa-phone" />
                                                    </span>
                                                    <input
                                                        type="tel"
                                                        className="form-control"
                                                        id="phone"
                                                        name="phone"
                                                        placeholder="0788358955"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Adresse */}
                                    <div className="mb-3">
                                        <label htmlFor="address" className="form-label">Adresse</label>
                                        <div className="input-group">
                                            <span className="input-group-text">
                                                <i className="fas fa-map-marker-alt" />
                                            </span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="address"
                                                name="address"
                                                placeholder="Adresse complète"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    {/* Ville, Pays et Code postal */}
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="mb-3">
                                                <label htmlFor="city" className="form-label">Ville</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="city"
                                                    name="city"
                                                    placeholder="Abidjan"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="mb-3">
                                                <label htmlFor="country" className="form-label">Pays</label>
                                                <select
                                                    className="form-select"
                                                    id="country"
                                                    name="country"
                                                    value={formData.country}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Sélectionner un pays</option>
                                                    <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="mb-3">
                                                <label htmlFor="zip_code" className="form-label">Code postal</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    id="zip_code"
                                                    name="zip_code"
                                                    placeholder="225"
                                                    value={formData.zip_code}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rôle */}
                                    <div className="mb-3">
                                        <label htmlFor="role_id" className="form-label">
                                            Type de compte <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-control"
                                            id="role_id"
                                            name="role_id"
                                            value={formData.role_id}
                                            onChange={handleInputChange}
                                            required
                                        >
                                            <option value="">Sélectionner un type de compte</option>
                                            <option value="2">Partenaire</option>
                                            <option value="3">Marchand</option>
                                        </select>
                                    </div>

                                    {/* Mot de passe */}
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="password" className="form-label">
                                                    Mot de passe <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="fas fa-lock" />
                                                    </span>
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        id="password"
                                                        name="password"
                                                        placeholder="Min. 8 caractères"
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        required
                                                        minLength={8}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="confirm_password" className="form-label">
                                                    Confirmer le mot de passe <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <span className="input-group-text">
                                                        <i className="fas fa-lock" />
                                                    </span>
                                                    <input
                                                        type="password"
                                                        className="form-control"
                                                        id="confirm_password"
                                                        name="confirm_password"
                                                        placeholder="Confirmer"
                                                        value={formData.confirm_password}
                                                        onChange={handleInputChange}
                                                        required
                                                        minLength={8}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    {isSubmitting ? (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                            <Loader />
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                data-bs-dismiss="modal"
                                                onClick={resetForm}
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                disabled={isSubmitting}
                                            >
                                                <>
                                                    <i className="fas fa-plus me-2" />
                                                    Ajouter Partenaire
                                                </>

                                            </button>
                                        </>
                                    )}
                                </div>
                                {showAddModal && (
                                    <div
                                        className="modal-backdrop fade show"
                                        onClick={() => {
                                            setShowAddModal(false)
                                            resetForm()
                                            cleanupBackdrop()
                                        }}
                                    />
                                )}
                            </form>
                        </div>
                    </div>
                </div>

                {/* Modal Détails des Commissions */}
                {selectedPartner && (
                    <div
                        className={`modal fade ${showCommissionsModal ? 'show' : ''}`}
                        id="commissionsModal"
                        tabIndex={-1}
                        style={{ display: showCommissionsModal ? 'block' : 'none' }}
                        aria-labelledby="commissionsModalLabel"
                        aria-hidden={!showCommissionsModal}
                    >
                        <div className="modal-dialog modal-lg">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title" id="commissionsModalLabel">
                                        Détails des commissions - {selectedPartner.firstname} {selectedPartner.lastname}
                                    </h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={handleCloseCommissionsModal}
                                        aria-label="Close"
                                    />
                                </div>
                                <div className="modal-body">
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Marchand</th>
                                                    <th>Code Frais</th>
                                                    <th>Type</th>
                                                    <th>Valeur Commission</th>
                                                    <th>Frais Associé</th>
                                                    <th>Type de Transaction</th>
                                                    <th>Statut</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedPartner.commissions && selectedPartner.commissions.length > 0 ? (
                                                    selectedPartner.commissions.map((commission) => (
                                                        <tr key={commission.id}>
                                                            <td>
                                                                <span className="fw-semibold">
                                                                    {commission.fee?.partner?.name || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="fw-semibold">
                                                                    {commission.fee?.code || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="badge rounded text-info bg-info-subtle">
                                                                    {commission.fee?.type === 'percentage' ? 'Pourcentage' : 'Fixe'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="badge rounded text-success bg-success-subtle">
                                                                    {commission.fee?.type === 'percentage'
                                                                        ? `${commission.value}%`
                                                                        : `${commission.value} FCFA`}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="badge rounded text-danger bg-danger-subtle">
                                                                    {commission.fee?.type === 'percentage'
                                                                        ? `${commission.fee.value}%`
                                                                        : `${commission.fee.value} FCFA`}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <span className="badge rounded text-primary bg-primary-subtle">
                                                                    {getTransactionTypeLabel(commission.fee?.transaction_type_id) || 'N/A'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {commission.active ? (
                                                                    <span className="badge rounded text-success bg-success-subtle">
                                                                        Actif
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge rounded text-danger bg-danger-subtle">
                                                                        Inactif
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="6" className="text-center text-muted">
                                                            Aucune commission trouvée
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Résumé */}
                                    {selectedPartner.commissions && selectedPartner.commissions.length > 0 && (
                                        <div className="mt-3 p-3 bg-light rounded">
                                            <h6 className="mb-2">Résumé :</h6>
                                            <p className="mb-1">
                                                <strong>Total des commissions :</strong> {selectedPartner.commissions.length}
                                            </p>
                                            <p className="mb-0">
                                                <strong>Commissions actives :</strong> {selectedPartner.commissions.filter(c => c.active).length}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleCloseCommissionsModal}
                                    >
                                        Fermer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showCommissionsModal && (
                    <div
                        className="modal-backdrop fade show"
                        onClick={handleCloseCommissionsModal}
                    />
                )}
                <Footer />
            </div>

        </Layout>
    )
}
