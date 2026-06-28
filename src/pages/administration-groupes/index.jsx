import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { LoaderContainer } from '../../components/loader';
import { PageHeader } from '../../components/page-header';
import { AdminGroupsStepNav } from '../../components/admin-groups-step-nav';
import { CollapsiblePanel } from '../../components/collapsible-panel';
import { listAdministrateurs, updateAdministrateur } from '../../services/administrateurs';
import {
    listPartenaires,
    createPartenaire,
    updatePartenaire,
    listGroupesAdmin,
    createGroupeAdmin,
    updateGroupeAdmin,
    listCartesAutorisees,
    addCartesAutorisees,
    removeCartesAutorisees,
    createAgentForGroupe
} from '../../services/accessControl';
import { sendToastError, sendToastSuccess } from '../../helpers';
import { useI18n } from '../../i18n';
import { extractList, getApiErrorMessage, isApiSuccess } from '../../utils/apiResponse';
import { parseAndValidateCardsInput } from '../../utils/carteAutorisee';
import './admin-groups-tabs.css';

const INTERFACE_LINK_OPTIONS = [
    { path: '/', labelKey: 'administration.pageDashboard' },
    { path: '/contrats-clients', labelKey: 'administration.pageContractsClients' },
    { path: '/clients', labelKey: 'administration.pageClients' },
    { path: '/administration', labelKey: 'administration.pageAdministration' }
];

const DEFAULT_AGENTS_LIMIT = 10;

/**
 * Page dédiée à la gestion des partenaires, groupes, cartes autorisées et agents.
 */
export const AdministrationGroupes = () => {
    const { t } = useI18n();
    const token = useSelector((s) => s.auth.token);
    const [partners, setPartners] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedCardsGroupId, setSelectedCardsGroupId] = useState('');
    const [selectedAgentGroupId, setSelectedAgentGroupId] = useState('');
    const [groupCards, setGroupCards] = useState([]);
    const [agentGroupCards, setAgentGroupCards] = useState([]);
    const [cardsInput, setCardsInput] = useState('');
    const [activeStep, setActiveStep] = useState('partners');
    const [mainTab, setMainTab] = useState('setup');
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState([]);
    const [loadingAgents, setLoadingAgents] = useState(false);
    const [agentsPage, setAgentsPage] = useState(1);
    const [agentsLimit, setAgentsLimit] = useState(DEFAULT_AGENTS_LIMIT);
    const [editingAgent, setEditingAgent] = useState(null);
    const [agentEditForm, setAgentEditForm] = useState({ userValidFrom: '', userValidTo: '' });
    const [savingAgentDates, setSavingAgentDates] = useState(false);
    const [cardToDelete, setCardToDelete] = useState(null);
    const [deletingCard, setDeletingCard] = useState(false);
    const [partnerForm, setPartnerForm] = useState({ nom: '', contact: '', adresse: '', isActive: true });
    const [groupForm, setGroupForm] = useState({ nom: '', partenaireId: '', validFrom: '', validTo: '', isActive: true });
    const [editingPartner, setEditingPartner] = useState(null);
    const [partnerEditForm, setPartnerEditForm] = useState({ nom: '', contact: '', adresse: '', isActive: true });
    const [editingGroup, setEditingGroup] = useState(null);
    const [groupEditForm, setGroupEditForm] = useState({ nom: '', partenaireId: '', validFrom: '', validTo: '', isActive: true });
    const [agentForm, setAgentForm] = useState({
        login: '',
        password: '',
        nom: '',
        prenom: '',
        email: '',
        isActive: true,
        userValidFrom: '',
        userValidTo: '',
        interfaceLinks: ['/contrats-clients']
    });
    const selectedCardsGroup = groups.find((g) => g.id === selectedCardsGroupId) || null;
    const selectedAgentGroup = groups.find((g) => g.id === selectedAgentGroupId) || null;

    /** Étapes affichées dans la navigation progressive. */
    const setupSteps = useMemo(() => ([
        { id: 'partners', number: 1, label: t('administration.partners'), count: partners.length },
        { id: 'groups', number: 2, label: t('administration.groups'), count: groups.length },
        { id: 'cards', number: 3, label: t('administration.stepCardsLabel'), count: groupCards.length },
        { id: 'agent', number: 4, label: t('administration.stepAgentLabel'), count: agents.length }
    ]), [t, partners.length, groups.length, groupCards.length, agents.length]);

    /** Agents affichés sur la page courante (pagination client). */
    const agentsTotalPages = Math.max(1, Math.ceil(agents.length / agentsLimit));
    const paginatedAgents = useMemo(() => {
        const start = (agentsPage - 1) * agentsLimit;
        return agents.slice(start, start + agentsLimit);
    }, [agents, agentsPage, agentsLimit]);

    useEffect(() => {
        if (agentsPage > agentsTotalPages) setAgentsPage(1);
    }, [agentsPage, agentsTotalPages]);

    /** Convertit une date ISO en format compatible input datetime-local. */
    const toInputDateTime = (value) => {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    /** Charge partenaires + groupes pour la page de gestion des accès. */
    const fetchAccessControlData = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [partnersRes, groupsRes] = await Promise.all([listPartenaires(token), listGroupesAdmin(token)]);
            const partnersList = extractList(partnersRes, ['partenaires']);
            const groupsList = extractList(groupsRes, ['groupes', 'groupesAdmin']);
            setPartners(partnersList);
            setGroups(groupsList);
        } catch {
            sendToastError(t('administration.loadGroupsError'));
        } finally {
            setLoading(false);
        }
    }, [t, token]);

    useEffect(() => {
        fetchAccessControlData();
    }, [fetchAccessControlData]);

    /** Charge la liste des agents (admins avec role AGENT). */
    const fetchAgents = useCallback(async () => {
        if (!token) return;
        setLoadingAgents(true);
        try {
            const res = await listAdministrateurs(token, { page: 1, limit: 1000 });
            const list = extractList(res, ['administrateurs']);
            const onlyAgents = list.filter((a) => String(a.role || '').toUpperCase() === 'AGENT');
            setAgents(onlyAgents);
        } catch {
            setAgents([]);
        } finally {
            setLoadingAgents(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    useEffect(() => {
        if (!token || !selectedCardsGroupId) {
            setGroupCards([]);
            return;
        }
        listCartesAutorisees(token, selectedCardsGroupId)
            .then((res) => setGroupCards(extractList(res, ['cartes'])))
            .catch(() => setGroupCards([]));
    }, [token, selectedCardsGroupId]);

    useEffect(() => {
        if (!token || !selectedAgentGroupId) {
            setAgentGroupCards([]);
            return;
        }
        listCartesAutorisees(token, selectedAgentGroupId)
            .then((res) => setAgentGroupCards(extractList(res, ['cartes'])))
            .catch(() => setAgentGroupCards([]));
    }, [token, selectedAgentGroupId]);

    /** Crée un partenaire puis rafraîchit les données de la page. */
    const handleCreatePartner = async (e) => {
        e.preventDefault();
        try {
            const res = await createPartenaire(token, partnerForm);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('administration.partnerCreated'));
                setPartnerForm({ nom: '', contact: '', adresse: '', isActive: true });
                fetchAccessControlData();
                setActiveStep('groups');
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('administration.genericError')));
        }
    };

    /** Crée un groupe puis recharge la liste. */
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...groupForm,
                validFrom: groupForm.validFrom ? new Date(groupForm.validFrom).toISOString() : null,
                validTo: groupForm.validTo ? new Date(groupForm.validTo).toISOString() : null
            };
            const res = await createGroupeAdmin(token, payload);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('administration.groupCreated'));
                const createdGroupId = res.data?.id ?? res.data?.groupeId ?? null;
                if (createdGroupId) {
                    setSelectedCardsGroupId(createdGroupId);
                }
                setGroupForm({ nom: '', partenaireId: '', validFrom: '', validTo: '', isActive: true });
                fetchAccessControlData();
                setActiveStep('cards');
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('administration.genericError')));
        }
    };

    /** Ajoute des cartes autorisées au groupe sélectionné. */
    const handleAddCards = async (e) => {
        e.preventDefault();
        if (!selectedCardsGroupId) {
            sendToastError(t('administration.cardsGroupRequired'));
            return;
        }
        const { valid: cartes, invalid } = parseAndValidateCardsInput(cardsInput);
        if (cartes.length === 0 && invalid.length === 0) {
            sendToastError(t('administration.cardsInputRequired'));
            return;
        }
        if (invalid.length > 0) {
            sendToastError(t('administration.cardsInvalidFormat', {
                cards: invalid.slice(0, 3).join(', ') + (invalid.length > 3 ? '…' : '')
            }));
            return;
        }
        try {
            const res = await addCartesAutorisees(token, selectedCardsGroupId, cartes);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('administration.cardsAddedCount', { count: cartes.length }));
                setCardsInput('');
                const refresh = await listCartesAutorisees(token, selectedCardsGroupId);
                const cards = extractList(refresh, ['cartes']);
                setGroupCards(cards);
                if (selectedAgentGroupId && selectedAgentGroupId === selectedCardsGroupId) {
                    setAgentGroupCards(cards);
                }
                setActiveStep('agent');
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('administration.genericError')));
        }
    };

    /** Crée un agent pour le groupe choisi avec pages autorisées cochées. */
    const handleCreateAgent = async (e) => {
        e.preventDefault();
        if (!selectedAgentGroupId) {
            sendToastError(t('administration.mustSelectGroupForAgent'));
            return;
        }
        if (!selectedAgentGroup?.partenaireId && !selectedAgentGroup?.partenaire?.id) {
            sendToastError(t('administration.groupMustHavePartner'));
            return;
        }
        if (!agentGroupCards.length) {
            sendToastError(t('administration.groupMustHaveCard'));
            return;
        }
        if (!agentForm.interfaceLinks.length) {
            sendToastError(t('administration.mustSelectAtLeastOnePage'));
            return;
        }
        try {
            const payload = {
                ...agentForm,
                userValidFrom: agentForm.userValidFrom ? new Date(agentForm.userValidFrom).toISOString() : null,
                userValidTo: agentForm.userValidTo ? new Date(agentForm.userValidTo).toISOString() : null
            };
            const res = await createAgentForGroupe(token, selectedAgentGroupId, payload);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('administration.agentCreated'));
                setAgentForm({
                    login: '',
                    password: '',
                    nom: '',
                    prenom: '',
                    email: '',
                    isActive: true,
                    userValidFrom: '',
                    userValidTo: '',
                    interfaceLinks: ['/contrats-clients']
                });
                fetchAgents();
                setMainTab('agents');
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('administration.genericError')));
        }
    };

    /** Coche/décoche une page autorisée pour l'agent en cours de création. */
    const toggleAgentInterfaceLink = (path) => {
        const has = agentForm.interfaceLinks.includes(path);
        if (has && agentForm.interfaceLinks.length === 1) {
            sendToastError(t('administration.mustSelectAtLeastOnePage'));
            return;
        }
        setAgentForm((prev) => ({
            ...prev,
            interfaceLinks: has
                ? prev.interfaceLinks.filter((p) => p !== path)
                : [...prev.interfaceLinks, path]
        }));
    };

    /** Ouvre la modale d'édition des dates de validité d'un agent. */
    const openAgentDatesModal = (agent) => {
        setEditingAgent(agent);
        setAgentEditForm({
            userValidFrom: toInputDateTime(agent.userValidFrom),
            userValidTo: toInputDateTime(agent.userValidTo)
        });
    };

    /** Ouvre la modale de modification d'un partenaire. */
    const openPartnerModal = (partner) => {
        setEditingPartner(partner);
        setPartnerEditForm({
            nom: partner.nom ?? '',
            contact: partner.contact ?? '',
            adresse: partner.adresse ?? '',
            isActive: partner.isActive ?? true
        });
    };

    /** Enregistre la modification d'un partenaire. */
    const handleSavePartner = async (e) => {
        e.preventDefault();
        if (!editingPartner?.id) return;
        try {
            const res = await updatePartenaire(token, editingPartner.id, partnerEditForm);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('administration.partnerUpdated'));
                setEditingPartner(null);
                fetchAccessControlData();
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('administration.genericError')));
        }
    };

    /** Ouvre la modale de modification d'un groupe. */
    const openGroupModal = (group) => {
        setEditingGroup(group);
        setGroupEditForm({
            nom: group.nom ?? '',
            partenaireId: group.partenaireId ?? group.partenaire?.id ?? '',
            validFrom: toInputDateTime(group.validFrom),
            validTo: toInputDateTime(group.validTo),
            isActive: group.isActive ?? true
        });
    };

    /** Enregistre la modification d'un groupe. */
    const handleSaveGroup = async (e) => {
        e.preventDefault();
        if (!editingGroup?.id) return;
        try {
            const payload = {
                ...groupEditForm,
                validFrom: groupEditForm.validFrom ? new Date(groupEditForm.validFrom).toISOString() : null,
                validTo: groupEditForm.validTo ? new Date(groupEditForm.validTo).toISOString() : null
            };
            const res = await updateGroupeAdmin(token, editingGroup.id, payload);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('administration.groupUpdated'));
                setEditingGroup(null);
                fetchAccessControlData();
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('administration.genericError')));
        }
    };

    /** Enregistre les nouvelles dates de validité de l'agent. */
    const handleSaveAgentDates = async (e) => {
        e.preventDefault();
        if (!editingAgent?.id) return;
        setSavingAgentDates(true);
        try {
            const payload = {
                userValidFrom: agentEditForm.userValidFrom ? new Date(agentEditForm.userValidFrom).toISOString() : null,
                userValidTo: agentEditForm.userValidTo ? new Date(agentEditForm.userValidTo).toISOString() : null
            };
            const res = await updateAdministrateur(token, editingAgent.id, payload);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('administration.agentDatesUpdated'));
                setEditingAgent(null);
                fetchAgents();
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('administration.genericError')));
        } finally {
            setSavingAgentDates(false);
        }
    };

    /** Supprime une carte autorisée après confirmation utilisateur. */
    const handleConfirmDeleteCard = async () => {
        if (!selectedCardsGroupId || !cardToDelete) return;
        setDeletingCard(true);
        try {
            const res = await removeCartesAutorisees(token, selectedCardsGroupId, [cardToDelete]);
            if (isApiSuccess(res)) {
                sendToastSuccess(t('administration.cardDeleted'));
                setCardToDelete(null);
                const refresh = await listCartesAutorisees(token, selectedCardsGroupId);
                const cards = extractList(refresh, ['cartes']);
                setGroupCards(cards);
                if (selectedAgentGroupId && selectedAgentGroupId === selectedCardsGroupId) {
                    setAgentGroupCards(cards);
                }
            } else {
                sendToastError(res.message || t('administration.cardDeleteError'));
            }
        } catch (err) {
            sendToastError(getApiErrorMessage(err, t('administration.cardDeleteError')));
        } finally {
            setDeletingCard(false);
        }
    };

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <PageHeader title={t('administration.groupsSection')} />

                    <ul className="nav nav-tabs mb-3 admin-groups-tab">
                        <li className="nav-item">
                            <button type="button" className={`nav-link ${mainTab === 'setup' ? 'active' : ''}`} onClick={() => setMainTab('setup')}>
                                {t('administration.tabSetup')}
                            </button>
                        </li>
                        <li className="nav-item">
                            <button type="button" className={`nav-link ${mainTab === 'agents' ? 'active' : 'text-secondary'}`} onClick={() => setMainTab('agents')}>
                                {t('administration.tabAgents')}
                                {/* <span className={`badge rounded-pill ms-2 align-middle agents-tab-count ${mainTab === 'agents' ? 'is-active' : 'is-inactive'}`}>
                                    {agents.length}
                                </span> */}
                            </button>
                        </li>
                    </ul>

                    {mainTab === 'setup' && (
                    <div className="card">
                        <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
                            <div>
                                <h5 className="card-title mb-1">{t('administration.stepsTitle')}</h5>
                                <p className="text-muted small mb-0">{t('administration.workflowHint')}</p>
                            </div>
                            <button type="button" className="btn btn-outline-secondary btn-sm flex-shrink-0" onClick={fetchAccessControlData}>
                                {t('administration.refresh')}
                            </button>
                        </div>
                        <div className="card-body">
                            <AdminGroupsStepNav
                                steps={setupSteps}
                                activeStep={activeStep}
                                onChange={setActiveStep}
                                ariaLabel={t('administration.stepNavAria')}
                            />
                            {loading ? (
                                <LoaderContainer />
                            ) : (
                                <>
                                    {activeStep === 'partners' && (
                                        <div className="mx-auto" style={{ maxWidth: 640 }}>
                                            <h6 className="mb-2">{t('administration.partners')}</h6>
                                            <p className="text-muted small mb-3">{t('administration.partnersHelp')}</p>
                                            <form onSubmit={handleCreatePartner}>
                                                <div className="mb-2">
                                                    <label className="form-label small">{t('administration.partnerName')}</label>
                                                    <input className="form-control" value={partnerForm.nom} onChange={(e) => setPartnerForm((p) => ({ ...p, nom: e.target.value }))} />
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label small">{t('administration.contact')}</label>
                                                    <input className="form-control" value={partnerForm.contact} onChange={(e) => setPartnerForm((p) => ({ ...p, contact: e.target.value }))} />
                                                </div>
                                                <div className="mb-3">
                                                    <label className="form-label small">{t('administration.address')}</label>
                                                    <input className="form-control" value={partnerForm.adresse} onChange={(e) => setPartnerForm((p) => ({ ...p, adresse: e.target.value }))} />
                                                </div>
                                                <button className="btn btn-primary w-100 w-sm-auto" type="submit">{t('administration.createPartner')}</button>
                                            </form>
                                            <CollapsiblePanel title={t('administration.partnersListTitle', { count: partners.length })}>
                                                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                                    {partners.length === 0 ? (
                                                        <p className="text-muted small mb-0">{t('administration.noPartners')}</p>
                                                    ) : partners.map((p) => (
                                                        <div key={p.id} className="d-flex align-items-center gap-2 border rounded p-2 mb-2">
                                                            <span className="flex-grow-1 text-truncate" style={{ minWidth: 0 }} title={p.nom}>{p.nom}</span>
                                                            <button type="button" className="btn btn-outline-primary btn-sm flex-shrink-0" onClick={() => openPartnerModal(p)} title={t('administration.editPartner')}>
                                                                {t('administration.edit')}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CollapsiblePanel>
                                        </div>
                                    )}

                                    {activeStep === 'groups' && (
                                        <div className="mx-auto" style={{ maxWidth: 640 }}>
                                            <h6 className="mb-2">{t('administration.groups')}</h6>
                                            <p className="text-muted small mb-3">{t('administration.groupsHelp')}</p>
                                            <form onSubmit={handleCreateGroup}>
                                                <div className="mb-2">
                                                    <label className="form-label small">{t('administration.groupName')}</label>
                                                    <input className="form-control" value={groupForm.nom} onChange={(e) => setGroupForm((g) => ({ ...g, nom: e.target.value }))} />
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label small">{t('administration.selectPartner')}</label>
                                                    <select className="form-select" value={groupForm.partenaireId} onChange={(e) => setGroupForm((g) => ({ ...g, partenaireId: e.target.value }))}>
                                                        <option value="">{t('administration.selectPartner')}</option>
                                                        {partners.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                                    </select>
                                                </div>
                                                <div className="row g-2 mb-3">
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small">{t('administration.validFrom')}</label>
                                                        <input type="datetime-local" className="form-control" value={groupForm.validFrom} onChange={(e) => setGroupForm((g) => ({ ...g, validFrom: e.target.value }))} />
                                                    </div>
                                                    <div className="col-12 col-md-6">
                                                        <label className="form-label small">{t('administration.validTo')}</label>
                                                        <input type="datetime-local" className="form-control" value={groupForm.validTo} onChange={(e) => setGroupForm((g) => ({ ...g, validTo: e.target.value }))} />
                                                    </div>
                                                </div>
                                                <button className="btn btn-primary w-100 w-sm-auto" type="submit">{t('administration.createGroup')}</button>
                                            </form>
                                            <CollapsiblePanel title={t('administration.groupsListTitle', { count: groups.length })}>
                                                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                                    {groups.length === 0 ? (
                                                        <p className="text-muted small mb-0">{t('administration.noGroups')}</p>
                                                    ) : groups.map((g) => (
                                                        <div key={g.id} className="d-flex align-items-center gap-2 border rounded p-2 mb-2">
                                                            <span className="flex-grow-1 text-truncate" style={{ minWidth: 0 }} title={g.nom}>{g.nom}</span>
                                                            <button type="button" className="btn btn-outline-primary btn-sm flex-shrink-0" onClick={() => openGroupModal(g)} title={t('administration.editGroup')}>
                                                                {t('administration.edit')}
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CollapsiblePanel>
                                        </div>
                                    )}

                                    {activeStep === 'cards' && (
                                        <div className="mx-auto" style={{ maxWidth: 640 }}>
                                            <h6 className="mb-2">{t('administration.cards')}</h6>
                                            <p className="text-muted small mb-3">{t('administration.cardsHelp')}</p>
                                            <div className="mb-3">
                                                <label className="form-label small">{t('administration.cardsGroupPickerTitle')}</label>
                                                <select className="form-select" value={selectedCardsGroupId} onChange={(e) => setSelectedCardsGroupId(e.target.value)}>
                                                    <option value="">{t('administration.selectGroup')}</option>
                                                    {groups.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
                                                </select>
                                                {!selectedCardsGroupId ? (
                                                    <small className="text-warning d-block mt-2">{t('administration.cardsGroupRequired')}</small>
                                                ) : (
                                                    <small className="text-success d-block mt-2">{t('administration.cardsGroupSelected', { group: selectedCardsGroup?.nom || '-' })}</small>
                                                )}
                                            </div>
                                            <form onSubmit={handleAddCards}>
                                                <label className="form-label small">{t('administration.cardsOnePerLine')}</label>
                                                <textarea className="form-control mb-3" rows={6} placeholder={t('administration.cardsOnePerLine')} value={cardsInput} onChange={(e) => setCardsInput(e.target.value)} disabled={!selectedCardsGroupId} />
                                                <button className="btn btn-primary w-100 w-sm-auto" type="submit" disabled={!selectedCardsGroupId}>{t('administration.addCards')}</button>
                                            </form>
                                            <CollapsiblePanel title={t('administration.cardsListTitle', { count: groupCards.length })} defaultOpen={groupCards.length > 0}>
                                                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                                                    {groupCards.length === 0 ? (
                                                        <p className="text-muted small mb-0">{t('administration.noCards')}</p>
                                                    ) : (
                                                        <div className="d-flex flex-column gap-2">
                                                            {groupCards.map((c, idx) => {
                                                                const cardValue = c?.numeroCarte || c?.cardNumber || c;
                                                                return (
                                                                    <div key={c.id || `${cardValue}-${idx}`} className="border rounded p-2 d-flex justify-content-between align-items-center gap-2">
                                                                        <span className="small text-break" style={{ minWidth: 0 }}>{cardValue}</span>
                                                                        <button type="button" className="btn btn-sm btn-outline-danger p-1 flex-shrink-0" onClick={() => setCardToDelete(String(cardValue))} aria-label={t('administration.delete')} title={t('administration.delete')}>
                                                                            <i className="iconoir-trash" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </CollapsiblePanel>
                                        </div>
                                    )}

                                    {activeStep === 'agent' && (
                                        <div className="mx-auto" style={{ maxWidth: 760 }}>
                                            <h6 className="mb-2">{t('administration.createAgent')}</h6>
                                            <p className="text-muted small mb-3">{t('administration.agentHelp')}</p>
                                            <div className="mb-3">
                                                <label className="form-label small">{t('administration.agentGroupPickerTitle')}</label>
                                                <select className="form-select" value={selectedAgentGroupId} onChange={(e) => setSelectedAgentGroupId(e.target.value)}>
                                                    <option value="">{t('administration.selectGroup')}</option>
                                                    {groups.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
                                                </select>
                                                {!selectedAgentGroupId ? (
                                                    <small className="text-warning d-block mt-2">{t('administration.agentGroupRequired')}</small>
                                                ) : (
                                                    <small className="text-success d-block mt-2">{t('administration.selectedGroupBadge', { group: selectedAgentGroup?.nom || '-' })}</small>
                                                )}
                                            </div>
                                            <form onSubmit={handleCreateAgent} className="row g-3">
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small">{t('administration.login')}</label>
                                                    <input className="form-control" value={agentForm.login} onChange={(e) => setAgentForm((a) => ({ ...a, login: e.target.value }))} />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small">{t('administration.password')}</label>
                                                    <input className="form-control" type="password" value={agentForm.password} onChange={(e) => setAgentForm((a) => ({ ...a, password: e.target.value }))} />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small">{t('administration.lastName')}</label>
                                                    <input className="form-control" value={agentForm.nom} onChange={(e) => setAgentForm((a) => ({ ...a, nom: e.target.value }))} />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small">{t('administration.firstName')}</label>
                                                    <input className="form-control" value={agentForm.prenom} onChange={(e) => setAgentForm((a) => ({ ...a, prenom: e.target.value }))} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label small">{t('administration.email')}</label>
                                                    <input className="form-control" type="email" value={agentForm.email} onChange={(e) => setAgentForm((a) => ({ ...a, email: e.target.value }))} />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small">{t('administration.validFrom')}</label>
                                                    <input type="datetime-local" className="form-control" value={agentForm.userValidFrom} onChange={(e) => setAgentForm((a) => ({ ...a, userValidFrom: e.target.value }))} />
                                                </div>
                                                <div className="col-12 col-md-6">
                                                    <label className="form-label small">{t('administration.validTo')}</label>
                                                    <input type="datetime-local" className="form-control" value={agentForm.userValidTo} onChange={(e) => setAgentForm((a) => ({ ...a, userValidTo: e.target.value }))} />
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label">{t('administration.authorizedPages')}</label>
                                                    <p className="text-muted small mb-2">{t('administration.pagesHint')}</p>
                                                    <div className="border rounded p-3">
                                                        <div className="d-flex flex-column flex-sm-row flex-wrap gap-2 gap-sm-3">
                                                            {INTERFACE_LINK_OPTIONS.map((item) => (
                                                                <label key={item.path} className="form-check-label d-flex align-items-center gap-2">
                                                                    <input type="checkbox" className="form-check-input" checked={agentForm.interfaceLinks.includes(item.path)} onChange={() => toggleAgentInterfaceLink(item.path)} />
                                                                    <span>{t(item.labelKey)}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <small className="text-muted d-block mt-2">{t('administration.agentDefaultLinks')}</small>
                                                    </div>
                                                </div>
                                                <div className="col-12">
                                                    <button className="btn btn-primary w-100 w-md-auto px-4" type="submit" disabled={!selectedAgentGroupId}>{t('administration.createAgent')}</button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    )}

                    {mainTab === 'agents' && (
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">{t('administration.agentsList')}</h5>
                        </div>
                        <div className="card-body">
                            {loadingAgents ? (
                                <LoaderContainer />
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>{t('administration.login')}</th>
                                                    <th>{t('administration.lastName')}</th>
                                                    <th>{t('administration.firstName')}</th>
                                                    <th>{t('administration.groupName')}</th>
                                                    <th>{t('administration.validFrom')}</th>
                                                    <th>{t('administration.validTo')}</th>
                                                    <th width="100">{t('administration.actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {agents.length === 0 ? (
                                                    <tr><td colSpan="7" className="text-center text-muted">{t('administration.noAgents')}</td></tr>
                                                ) : (
                                                    paginatedAgents.map((a) => (
                                                        <tr key={a.id}>
                                                            <td>{a.login}</td>
                                                            <td>{a.nom}</td>
                                                            <td>{a.prenom}</td>
                                                            <td>{a.groupeAdmin?.nom || a.groupeNom || '-'}</td>
                                                            <td>{a.userValidFrom ? new Date(a.userValidFrom).toLocaleString() : '-'}</td>
                                                            <td>{a.userValidTo ? new Date(a.userValidTo).toLocaleString() : '-'}</td>
                                                            <td>
                                                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => openAgentDatesModal(a)}>
                                                                    {t('administration.editDates')}
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="table-footer d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-3 border-top">
                                        <div className="d-flex align-items-center gap-2">
                                            <label className="form-label mb-0 text-nowrap">{t('administration.perPage')}</label>
                                            <select className="form-select form-select-sm w-auto" value={agentsLimit} onChange={(e) => { setAgentsLimit(Number(e.target.value)); setAgentsPage(1); }}>
                                                <option value={10}>10</option>
                                                <option value={25}>25</option>
                                                <option value={50}>50</option>
                                                <option value={100}>100</option>
                                            </select>
                                            <span className="text-muted small">{t('administration.totalAgents', { count: agents.length })}</span>
                                        </div>
                                        <nav aria-label="Pagination du tableau">
                                            <ul className="pagination pagination-sm mb-0">
                                                <li className={`page-item ${agentsPage <= 1 ? 'disabled' : ''}`}>
                                                    <button type="button" className="page-link" onClick={() => setAgentsPage((p) => Math.max(1, p - 1))} disabled={agentsPage <= 1}>{t('administration.previous')}</button>
                                                </li>
                                                {agentsTotalPages > 1 && Array.from({ length: agentsTotalPages }, (_, i) => i + 1)
                                                    .filter((p) => p === 1 || p === agentsTotalPages || (p >= agentsPage - 2 && p <= agentsPage + 2))
                                                    .map((p, i, arr) => (
                                                        <React.Fragment key={p}>
                                                            {i > 0 && arr[i - 1] !== p - 1 && <li className="page-item disabled"><span className="page-link">…</span></li>}
                                                            <li className={`page-item ${p === agentsPage ? 'active' : ''}`}>
                                                                <button type="button" className="page-link" onClick={() => setAgentsPage(p)}>{p}</button>
                                                            </li>
                                                        </React.Fragment>
                                                    ))}
                                                <li className={`page-item ${agentsPage >= agentsTotalPages ? 'disabled' : ''}`}>
                                                    <button type="button" className="page-link" onClick={() => setAgentsPage((p) => Math.min(agentsTotalPages, p + 1))} disabled={agentsPage >= agentsTotalPages}>{t('administration.next')}</button>
                                                </li>
                                            </ul>
                                            <span className="ms-2 text-muted small">{t('clients.page', { page: agentsPage, total: agentsTotalPages || 1 })}</span>
                                        </nav>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    )}
                </div>
                <Footer />
            </div>

            {editingAgent && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('administration.editAgentDatesTitle')}</h5>
                                <button type="button" className="btn-close" onClick={() => setEditingAgent(null)} aria-label={t('common.cancel')} />
                            </div>
                            <form onSubmit={handleSaveAgentDates}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">{t('administration.validFrom')}</label>
                                        <input type="datetime-local" className="form-control" value={agentEditForm.userValidFrom} onChange={(e) => setAgentEditForm((p) => ({ ...p, userValidFrom: e.target.value }))} />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">{t('administration.validTo')}</label>
                                        <input type="datetime-local" className="form-control" value={agentEditForm.userValidTo} onChange={(e) => setAgentEditForm((p) => ({ ...p, userValidTo: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditingAgent(null)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary" disabled={savingAgentDates}>{savingAgentDates ? t('common.loading') : t('common.save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {editingPartner && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('administration.editPartner')}</h5>
                                <button type="button" className="btn-close" onClick={() => setEditingPartner(null)} aria-label={t('common.cancel')} />
                            </div>
                            <form onSubmit={handleSavePartner}>
                                <div className="modal-body">
                                    <input className="form-control mb-2" value={partnerEditForm.nom} onChange={(e) => setPartnerEditForm((p) => ({ ...p, nom: e.target.value }))} placeholder={t('administration.partnerName')} />
                                    <input className="form-control mb-2" value={partnerEditForm.contact} onChange={(e) => setPartnerEditForm((p) => ({ ...p, contact: e.target.value }))} placeholder={t('administration.contact')} />
                                    <input className="form-control" value={partnerEditForm.adresse} onChange={(e) => setPartnerEditForm((p) => ({ ...p, adresse: e.target.value }))} placeholder={t('administration.address')} />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditingPartner(null)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary">{t('common.save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {editingGroup && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('administration.editGroup')}</h5>
                                <button type="button" className="btn-close" onClick={() => setEditingGroup(null)} aria-label={t('common.cancel')} />
                            </div>
                            <form onSubmit={handleSaveGroup}>
                                <div className="modal-body">
                                    <input className="form-control mb-2" value={groupEditForm.nom} onChange={(e) => setGroupEditForm((g) => ({ ...g, nom: e.target.value }))} placeholder={t('administration.groupName')} />
                                    <select className="form-select mb-2" value={groupEditForm.partenaireId} onChange={(e) => setGroupEditForm((g) => ({ ...g, partenaireId: e.target.value }))}>
                                        <option value="">{t('administration.selectPartner')}</option>
                                        {partners.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                    </select>
                                    <label className="form-label small">{t('administration.validFrom')}</label>
                                    <input type="datetime-local" className="form-control mb-2" value={groupEditForm.validFrom} onChange={(e) => setGroupEditForm((g) => ({ ...g, validFrom: e.target.value }))} />
                                    <label className="form-label small">{t('administration.validTo')}</label>
                                    <input type="datetime-local" className="form-control" value={groupEditForm.validTo} onChange={(e) => setGroupEditForm((g) => ({ ...g, validTo: e.target.value }))} />
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setEditingGroup(null)}>{t('common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary">{t('common.save')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {cardToDelete && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('administration.deleteCardTitle')}</h5>
                                <button type="button" className="btn-close" onClick={() => setCardToDelete(null)} aria-label={t('common.cancel')} />
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">{t('administration.deleteCardConfirm', { card: cardToDelete })}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setCardToDelete(null)} disabled={deletingCard}>{t('common.cancel')}</button>
                                <button type="button" className="btn btn-danger" onClick={handleConfirmDeleteCard} disabled={deletingCard}>
                                    {deletingCard ? t('common.loading') : t('administration.delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};
