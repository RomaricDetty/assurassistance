import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Layout } from '../../components/layout';
import { Footer } from '../../components/footer';
import { Loader } from '../../components/loader';
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

const INTERFACE_LINK_OPTIONS = [
    { path: '/', labelKey: 'administration.pageDashboard' },
    { path: '/contrats-clients', labelKey: 'administration.pageContractsClients' },
    { path: '/clients', labelKey: 'administration.pageClients' },
    { path: '/administration', labelKey: 'administration.pageAdministration' }
];

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
    const [loading, setLoading] = useState(false);
    const [agents, setAgents] = useState([]);
    const [loadingAgents, setLoadingAgents] = useState(false);
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

    /** Convertit une date ISO en format compatible input datetime-local. */
    const toInputDateTime = (value) => {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    /** Charge partenaires + groupes pour la page de gestion des accès. */
    const fetchAccessControlData = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const [partnersRes, groupsRes] = await Promise.all([listPartenaires(token), listGroupesAdmin(token)]);
            const partnersList = Array.isArray(partnersRes.data) ? partnersRes.data : partnersRes.data?.partenaires ?? [];
            const groupsList = Array.isArray(groupsRes.data) ? groupsRes.data : groupsRes.data?.groupes ?? groupsRes.data?.groupesAdmin ?? [];
            setPartners(partnersList);
            setGroups(groupsList);
        } catch (_) {
            sendToastError(t('administration.loadGroupsError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccessControlData();
    }, [token]);

    /** Charge la liste des agents (admins avec role AGENT). */
    const fetchAgents = async () => {
        if (!token) return;
        setLoadingAgents(true);
        try {
            const res = await listAdministrateurs(token, { page: 1, limit: 1000 });
            const list = Array.isArray(res.data) ? res.data : res.data?.administrateurs ?? res.data?.data ?? [];
            const onlyAgents = list.filter((a) => String(a.role || '').toUpperCase() === 'AGENT');
            setAgents(onlyAgents);
        } catch (_) {
            setAgents([]);
        } finally {
            setLoadingAgents(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, [token]);

    useEffect(() => {
        if (!token || !selectedCardsGroupId) {
            setGroupCards([]);
            return;
        }
        listCartesAutorisees(token, selectedCardsGroupId)
            .then((res) => {
                const cards = Array.isArray(res.data) ? res.data : res.data?.cartes ?? [];
                setGroupCards(cards);
            })
            .catch(() => setGroupCards([]));
    }, [token, selectedCardsGroupId]);

    useEffect(() => {
        if (!token || !selectedAgentGroupId) {
            setAgentGroupCards([]);
            return;
        }
        listCartesAutorisees(token, selectedAgentGroupId)
            .then((res) => {
                const cards = Array.isArray(res.data) ? res.data : res.data?.cartes ?? [];
                setAgentGroupCards(cards);
            })
            .catch(() => setAgentGroupCards([]));
    }, [token, selectedAgentGroupId]);

    /** Crée un partenaire puis rafraîchit les données de la page. */
    const handleCreatePartner = async (e) => {
        e.preventDefault();
        try {
            const res = await createPartenaire(token, partnerForm);
            if (res.data != null || res.success) {
                sendToastSuccess(t('administration.partnerCreated'));
                setPartnerForm({ nom: '', contact: '', adresse: '', isActive: true });
                fetchAccessControlData();
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(err.message || t('administration.genericError'));
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
            if (res?.success !== false) {
                sendToastSuccess(t('administration.groupCreated'));
                const createdGroupId = res.data?.id ?? res.data?.groupeId ?? null;
                if (createdGroupId) {
                    setSelectedCardsGroupId(createdGroupId);
                }
                setGroupForm({ nom: '', partenaireId: '', validFrom: '', validTo: '', isActive: true });
                fetchAccessControlData();
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(err.message || t('administration.genericError'));
        }
    };

    /** Ajoute des cartes autorisées au groupe sélectionné. */
    const handleAddCards = async (e) => {
        e.preventDefault();
        if (!selectedCardsGroupId) return;
        const cartes = cardsInput.split('\n').map((x) => x.trim()).filter(Boolean);
        if (cartes.length === 0) return;
        try {
            const res = await addCartesAutorisees(token, selectedCardsGroupId, cartes);
            if (res?.success !== false) {
                sendToastSuccess(t('administration.cardsAdded'));
                setCardsInput('');
                const refresh = await listCartesAutorisees(token, selectedCardsGroupId);
                const cards = Array.isArray(refresh.data) ? refresh.data : refresh.data?.cartes ?? [];
                setGroupCards(cards);
                if (selectedAgentGroupId && selectedAgentGroupId === selectedCardsGroupId) {
                    setAgentGroupCards(cards);
                }
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(err.message || t('administration.genericError'));
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
            if (res.data != null || res.success) {
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
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(err.message || t('administration.genericError'));
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
            if (res.data != null || res.success) {
                sendToastSuccess(t('administration.partnerUpdated'));
                setEditingPartner(null);
                fetchAccessControlData();
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(err.message || t('administration.genericError'));
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
            if (res.data != null || res.success) {
                sendToastSuccess(t('administration.groupUpdated'));
                setEditingGroup(null);
                fetchAccessControlData();
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(err.message || t('administration.genericError'));
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
            if (res.data != null || res.success) {
                sendToastSuccess(t('administration.agentDatesUpdated'));
                setEditingAgent(null);
                fetchAgents();
            } else sendToastError(res.message || t('administration.genericError'));
        } catch (err) {
            sendToastError(err.message || t('administration.genericError'));
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
            if (res?.success !== false) {
                sendToastSuccess(t('administration.cardDeleted'));
                setCardToDelete(null);
                const refresh = await listCartesAutorisees(token, selectedCardsGroupId);
                const cards = Array.isArray(refresh.data) ? refresh.data : refresh.data?.cartes ?? [];
                setGroupCards(cards);
                if (selectedAgentGroupId && selectedAgentGroupId === selectedCardsGroupId) {
                    setAgentGroupCards(cards);
                }
            } else {
                sendToastError(res.message || t('administration.cardDeleteError'));
            }
        } catch (err) {
            sendToastError(err.message || t('administration.cardDeleteError'));
        } finally {
            setDeletingCard(false);
        }
    };

    return (
        <Layout>
            <div className="page-content">
                <div className="container-fluid">
                    <div className="row">
                        <div className="col-sm-12">
                            <div className="page-title-box d-md-flex justify-content-md-between align-items-center">
                                <h4 className="page-title">{t('administration.groupsSection')}</h4>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item"><a href="/">Assur&apos;Assistance</a></li>
                                    <li className="breadcrumb-item active">{t('administration.groupsSection')}</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <div className="alert alert-info small">
                        <strong>{t('administration.stepsTitle')}</strong>
                        <ol className="mb-0 mt-2 ps-3">
                            <li>{t('administration.steps1')}</li>
                            <li>{t('administration.steps2')}</li>
                            <li>{t('administration.steps3')}</li>
                            <li>{t('administration.steps4')}</li>
                        </ol>
                    </div>

                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="card-title mb-0">{t('administration.groupsSection')}</h5>
                            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={fetchAccessControlData}>
                                {t('administration.refresh')}
                            </button>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-3"><Loader /></div>
                            ) : (
                                <div className="row g-3">
                                    <div className="col-lg-4">
                                        <h6 className="mb-2">1. {t('administration.partners')}</h6>
                                        <p className="text-muted small mb-2">{t('administration.partnersHelp')}</p>
                                        <form onSubmit={handleCreatePartner}>
                                            <input className="form-control mb-2" placeholder={t('administration.partnerName')} value={partnerForm.nom} onChange={(e) => setPartnerForm((p) => ({ ...p, nom: e.target.value }))} />
                                            <input className="form-control mb-2" placeholder={t('administration.contact')} value={partnerForm.contact} onChange={(e) => setPartnerForm((p) => ({ ...p, contact: e.target.value }))} />
                                            <input className="form-control mb-2" placeholder={t('administration.address')} value={partnerForm.adresse} onChange={(e) => setPartnerForm((p) => ({ ...p, adresse: e.target.value }))} />
                                            <button className="btn btn-primary btn-sm" type="submit">{t('administration.createPartner')}</button>
                                        </form>
                                        <div className="mt-2 border rounded p-2">
                                            <div className="small text-muted mb-2">{partners.length} partenaire(s)</div>
                                            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                                {partners.map((p) => (
                                                    <div key={p.id} className="d-flex justify-content-between align-items-center border rounded p-2 mb-1 gap-2">
                                                        <span className="small text-truncate" style={{ minWidth: 0 }}>{p.nom}</span>
                                                        <button type="button" className="btn btn-outline-primary btn-sm flex-shrink-0" onClick={() => openPartnerModal(p)}>
                                                            {t('administration.editPartner')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <h6 className="mb-2">2. {t('administration.groups')}</h6>
                                        <p className="text-muted small mb-2">{t('administration.groupsHelp')}</p>
                                        <form onSubmit={handleCreateGroup}>
                                            <input className="form-control mb-2" placeholder={t('administration.groupName')} value={groupForm.nom} onChange={(e) => setGroupForm((g) => ({ ...g, nom: e.target.value }))} />
                                            <select className="form-select mb-2" value={groupForm.partenaireId} onChange={(e) => setGroupForm((g) => ({ ...g, partenaireId: e.target.value }))}>
                                                <option value="">{t('administration.selectPartner')}</option>
                                                {partners.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                                            </select>
                                            <label className="form-label small">{t('administration.validFrom')}</label>
                                            <input type="datetime-local" className="form-control mb-2" value={groupForm.validFrom} onChange={(e) => setGroupForm((g) => ({ ...g, validFrom: e.target.value }))} />
                                            <label className="form-label small">{t('administration.validTo')}</label>
                                            <input type="datetime-local" className="form-control mb-2" value={groupForm.validTo} onChange={(e) => setGroupForm((g) => ({ ...g, validTo: e.target.value }))} />
                                            <button className="btn btn-primary btn-sm" type="submit">{t('administration.createGroup')}</button>
                                        </form>
                                        <div className="mt-2 border rounded p-2">
                                            <div className="small text-muted mb-2">{groups.length} groupe(s)</div>
                                            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                                {groups.map((g) => (
                                                    <div key={g.id} className="d-flex justify-content-between align-items-center border rounded p-2 mb-1 gap-2">
                                                        <span className="small text-truncate" style={{ minWidth: 0 }}>{g.nom}</span>
                                                        <button type="button" className="btn btn-outline-primary btn-sm flex-shrink-0" onClick={() => openGroupModal(g)}>
                                                            {t('administration.editGroup')}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4">
                                        <h6 className="mb-2">3. {t('administration.cards')}</h6>
                                        <p className="text-muted small mb-2">{t('administration.cardsHelp')}</p>
                                        <div className="border rounded p-2 mb-2">
                                            <label className="form-label small mb-1">{t('administration.cardsGroupPickerTitle')}</label>
                                            <select className="form-select form-select-sm" value={selectedCardsGroupId} onChange={(e) => setSelectedCardsGroupId(e.target.value)}>
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
                                            <textarea className="form-control mb-2" rows={5} placeholder={t('administration.cardsOnePerLine')} value={cardsInput} onChange={(e) => setCardsInput(e.target.value)} />
                                            <button className="btn btn-primary btn-sm" type="submit" disabled={!selectedCardsGroupId}>{t('administration.addCards')}</button>
                                        </form>
                                        <p className="text-muted small mb-1 mt-2">{t('administration.cardsGroupCurrentList')}</p>
                                        <div className="small text-muted mb-2">{groupCards.length} carte(s)</div>
                                        <div className="border rounded p-2" style={{ maxHeight: 220, overflowY: 'auto' }}>
                                            {groupCards.length === 0 ? (
                                                <div className="small text-muted">{t('administration.noCards')}</div>
                                            ) : (
                                                <div className="d-flex flex-column gap-2">
                                                    {groupCards.map((c, idx) => {
                                                        const cardValue = c?.numeroCarte || c?.cardNumber || c;
                                                        return (
                                                            <div key={c.id || `${cardValue}-${idx}`} className="border rounded p-2 d-flex justify-content-between align-items-center gap-2">
                                                                <span className="small text-break" style={{ minWidth: 0 }}>{cardValue}</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger p-1 flex-shrink-0"
                                                                    onClick={() => setCardToDelete(String(cardValue))}
                                                                    aria-label={t('administration.delete')}
                                                                    title={t('administration.delete')}
                                                                >
                                                                    <i className="iconoir-trash" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-12">
                                        <h6 className="mb-2">4. {t('administration.createAgent')}</h6>
                                        <p className="text-muted small mb-2">{t('administration.agentHelp')}</p>
                                        <div className="border rounded p-2 mb-2">
                                            <label className="form-label small mb-1">{t('administration.agentGroupPickerTitle')}</label>
                                            <select className="form-select form-select-sm" value={selectedAgentGroupId} onChange={(e) => setSelectedAgentGroupId(e.target.value)}>
                                                <option value="">{t('administration.selectGroup')}</option>
                                                {groups.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
                                            </select>
                                            {!selectedAgentGroupId ? (
                                                <small className="text-warning d-block mt-2">{t('administration.agentGroupRequired')}</small>
                                            ) : (
                                                <small className="text-success d-block mt-2">{t('administration.selectedGroupBadge', { group: selectedAgentGroup?.nom || '-' })}</small>
                                            )}
                                        </div>
                                        <form onSubmit={handleCreateAgent} className="row g-2">
                                            <div className="col-md-2"><input className="form-control" placeholder={t('administration.login')} value={agentForm.login} onChange={(e) => setAgentForm((a) => ({ ...a, login: e.target.value }))} /></div>
                                            <div className="col-md-2"><input className="form-control" type="password" placeholder={t('administration.password')} value={agentForm.password} onChange={(e) => setAgentForm((a) => ({ ...a, password: e.target.value }))} /></div>
                                            <div className="col-md-2"><input className="form-control" placeholder={t('administration.lastName')} value={agentForm.nom} onChange={(e) => setAgentForm((a) => ({ ...a, nom: e.target.value }))} /></div>
                                            <div className="col-md-2"><input className="form-control" placeholder={t('administration.firstName')} value={agentForm.prenom} onChange={(e) => setAgentForm((a) => ({ ...a, prenom: e.target.value }))} /></div>
                                            <div className="col-md-4"><input className="form-control" placeholder={t('administration.email')} value={agentForm.email} onChange={(e) => setAgentForm((a) => ({ ...a, email: e.target.value }))} /></div>
                                            <div className="col-md-3">
                                                <label className="form-label mb-1 small">{t('administration.validFrom')}</label>
                                                <input type="datetime-local" className="form-control" value={agentForm.userValidFrom} onChange={(e) => setAgentForm((a) => ({ ...a, userValidFrom: e.target.value }))} />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label mb-1 small">{t('administration.validTo')}</label>
                                                <input type="datetime-local" className="form-control" value={agentForm.userValidTo} onChange={(e) => setAgentForm((a) => ({ ...a, userValidTo: e.target.value }))} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label mb-1">{t('administration.authorizedPages')}</label>
                                                <p className="text-muted small mb-2">{t('administration.pagesHint')}</p>
                                                <div className="border rounded p-3 mb-3">
                                                    <div className="d-flex flex-wrap gap-3">
                                                    {INTERFACE_LINK_OPTIONS.map((item) => (
                                                        <label key={item.path} className="form-check-label d-flex align-items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                className="form-check-input"
                                                                checked={agentForm.interfaceLinks.includes(item.path)}
                                                                onChange={() => toggleAgentInterfaceLink(item.path)}
                                                            />
                                                            <span>{t(item.labelKey)}</span>
                                                        </label>
                                                    ))}
                                                    </div>
                                                    <small className="text-muted d-block mt-2">{t('administration.agentDefaultLinks')}</small>
                                                </div>
                                            </div>
                                            <div className="col-md-3 mt-2">
                                                <button className="btn btn-primary w-100" type="submit" disabled={!selectedAgentGroupId}>{t('administration.createAgent')}</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card mt-3">
                        <div className="card-header">
                            <h5 className="card-title mb-0">{t('administration.agentsList')}</h5>
                        </div>
                        <div className="card-body">
                            {loadingAgents ? (
                                <div className="text-center py-3"><Loader /></div>
                            ) : agents.length === 0 ? (
                                <p className="text-muted mb-0">{t('administration.noAgents')}</p>
                            ) : (
                                <>
                                    <div className="d-none d-md-block table-responsive">
                                        <table className="table table-hover mb-0">
                                            <thead>
                                                <tr>
                                                    <th>{t('administration.login')}</th>
                                                    <th>{t('administration.lastName')}</th>
                                                    <th>{t('administration.firstName')}</th>
                                                    <th>{t('administration.groupName')}</th>
                                                    <th>{t('administration.validFrom')}</th>
                                                    <th>{t('administration.validTo')}</th>
                                                    <th>{t('administration.actions')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {agents.map((a) => (
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
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="d-md-none">
                                        {agents.map((a) => (
                                            <div key={a.id} className="border rounded p-2 mb-2">
                                                <div className="fw-semibold">{a.login}</div>
                                                <div className="small text-muted">{a.prenom} {a.nom}</div>
                                                <div className="small">{t('administration.groupName')}: {a.groupeAdmin?.nom || a.groupeNom || '-'}</div>
                                                <div className="small">{t('administration.validFrom')}: {a.userValidFrom ? new Date(a.userValidFrom).toLocaleString() : '-'}</div>
                                                <div className="small mb-2">{t('administration.validTo')}: {a.userValidTo ? new Date(a.userValidTo).toLocaleString() : '-'}</div>
                                                <button type="button" className="btn btn-sm btn-outline-primary w-100" onClick={() => openAgentDatesModal(a)}>
                                                    {t('administration.editDates')}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <Footer />
            </div>

            {editingAgent && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
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
                    <div className="modal-dialog modal-dialog-centered">
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
                    <div className="modal-dialog modal-dialog-centered">
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
                    <div className="modal-dialog modal-dialog-centered">
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
