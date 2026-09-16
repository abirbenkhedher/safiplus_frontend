import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Badge, Form, Row, Col, Spinner, Alert, 
  Button, Pagination, Modal 
} from 'react-bootstrap';
import { 
  FaHistory, FaSearch, FaFilter, FaEye, FaUser, 
  FaClock, FaTrash, FaChartBar 
} from 'react-icons/fa';
import { getHistory, getHistoryEntry, getHistoryStats } from '../../api/history';
import { getUsers } from '../../api/users';
import { useAuth } from '../../context/AuthContext';

const HistoryView = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    limit: 20
  });
  const [filters, setFilters] = useState({
    entityType: '',
    action: '',
    userId: '',
    dateDebut: '',
    dateFin: '',
    search: ''
  });

  const loadHistory = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        ...filters,
        page,
        limit: pagination.limit
      };

      // Nettoyer les paramètres vides
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const response = await getHistory(params);
      setHistory(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getHistoryStats();
      setStats(response.data);
    } catch (err) {
      console.error('Erreur stats:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await getUsers();
      setUsers(response.data);
    } catch (err) {
      console.error('Erreur users:', err);
    }
  };

  useEffect(() => {
    loadHistory(1);
    loadStats();
    if (user?.role === 'ADMIN') {
      loadUsers();
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadHistory(1);
  };

  const handleReset = () => {
    setFilters({
      entityType: '',
      action: '',
      userId: '',
      dateDebut: '',
      dateFin: '',
      search: ''
    });
    setTimeout(() => loadHistory(1), 100);
  };

  const handleViewDetail = async (id) => {
    try {
      const response = await getHistoryEntry(id);
      setSelectedEntry(response.data);
      setShowDetailModal(true);
    } catch (err) {
      setError('Erreur lors du chargement du détail');
    }
  };

  const getActionBadge = (action) => {
    const variants = {
      CREATE: 'success',
      UPDATE: 'info',
      DELETE: 'danger',
      STATUS_CHANGE: 'warning',
      ASSIGN: 'primary',
      PAYMENT: 'success',
      LOGIN: 'secondary',
      LOGOUT: 'secondary'
    };
    const labels = {
      CREATE: 'Création',
      UPDATE: 'Modification',
      DELETE: 'Suppression',
      STATUS_CHANGE: 'Changement statut',
      ASSIGN: 'Assignation',
      PAYMENT: 'Paiement',
      LOGIN: 'Connexion',
      LOGOUT: 'Déconnexion'
    };
    return (
      <Badge bg={variants[action] || 'secondary'}>
        {labels[action] || action}
      </Badge>
    );
  };

  const getEntityTypeBadge = (type) => {
    const variants = {
      Reparation: 'primary',
      Client: 'info',
      User: 'dark',
      Status: 'warning',
      Famille: 'success',
      Categorie: 'secondary',
      Objet: 'info'
    };
    const labels = {
      Reparation: 'Réparation',
      Client: 'Client',
      User: 'Utilisateur',
      Status: 'Statut',
      Famille: 'Famille',
      Categorie: 'Catégorie',
      Objet: 'Objet'
    };
    return (
      <Badge bg={variants[type] || 'secondary'}>
        {labels[type] || type}
      </Badge>
    );
  };

  const getRoleBadge = (role) => {
    const variants = {
      ADMIN: 'danger',
      COMMERCIAL: 'info',
      REPARATEUR: 'warning'
    };
    return <Badge bg={variants[role] || 'secondary'}>{role}</Badge>;
  };

  const renderDetails = (item) => {
    if (item.action === 'STATUS_CHANGE') {
      return (
        <div className="d-flex align-items-center gap-1">
          <Badge style={{ backgroundColor: item.oldStatus?.color || '#6c757d' }}>
            {item.oldStatus?.label || 'N/A'}
          </Badge>
          <span>→</span>
          <Badge style={{ backgroundColor: item.newStatus?.color || '#6c757d' }}>
            {item.newStatus?.label || 'N/A'}
          </Badge>
        </div>
      );
    }

    if (item.action === 'UPDATE' && item.changes) {
      return (
        <div className="small">
          {Object.entries(item.changes).slice(0, 2).map(([key, val]) => (
            <div key={key}>
              <strong>{key}:</strong>{' '}
              <span className="text-muted">{String(val.old || '-')}</span>
              {' → '}
              <span className="text-success">{String(val.new || '-')}</span>
            </div>
          ))}
          {Object.keys(item.changes).length > 2 && (
            <small className="text-muted">
              +{Object.keys(item.changes).length - 2} autre(s)
            </small>
          )}
        </div>
      );
    }

    if (item.action === 'CREATE') {
      return <span className="text-success">Création de {item.entityType}</span>;
    }

    if (item.action === 'DELETE') {
      return <span className="text-danger">Suppression de {item.entityType}</span>;
    }

    if (item.action === 'ASSIGN') {
      return <span>Assignation du réparateur</span>;
    }

    if (item.comment) {
      return <span className="small">{item.comment}</span>;
    }

    return <span className="text-muted">-</span>;
  };

  return (
    <div className="fade-in">
      {/* En-tête */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="mb-0">
            <FaHistory className="me-2" />
            Historique des actions
          </h4>
          <small className="text-muted">
            {pagination.total} action(s) enregistrée(s)
          </small>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Statistiques */}
      {stats && (
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaHistory size={24} className="text-primary mb-2" />
                <h3 className="mb-0">{pagination.total}</h3>
                <small className="text-muted">Total actions</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaUser size={24} className="text-info mb-2" />
                <h3 className="mb-0">{stats.byUser?.length || 0}</h3>
                <small className="text-muted">Utilisateurs actifs</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaChartBar size={24} className="text-success mb-2" />
                <h3 className="mb-0">{stats.byEntityType?.length || 0}</h3>
                <small className="text-muted">Types d'entités</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm">
              <Card.Body className="text-center">
                <FaClock size={24} className="text-warning mb-2" />
                <h3 className="mb-0">{stats.byDay?.length || 0}</h3>
                <small className="text-muted">Jours d'activité</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Filtres */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="g-2">
              <Col md={3}>
                <Form.Control
                  type="text"
                  placeholder="Rechercher..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </Col>
              <Col md={2}>
                <Form.Select
                  value={filters.entityType}
                  onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                >
                  <option value="">Tous les types</option>
                  <option value="Reparation">Réparations</option>
                  <option value="Client">Clients</option>
                  <option value="User">Utilisateurs</option>
                  <option value="Status">Statuts</option>
                  <option value="Famille">Familles</option>
                  <option value="Categorie">Catégories</option>
                  <option value="Objet">Objets</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                >
                  <option value="">Toutes les actions</option>
                  <option value="CREATE">Création</option>
                  <option value="UPDATE">Modification</option>
                  <option value="DELETE">Suppression</option>
                  <option value="STATUS_CHANGE">Changement statut</option>
                  <option value="ASSIGN">Assignation</option>
                  <option value="PAYMENT">Paiement</option>
                </Form.Select>
              </Col>
              {user?.role === 'ADMIN' && (
                <Col md={2}>
                  <Form.Select
                    value={filters.userId}
                    onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                  >
                    <option value="">Tous les utilisateurs</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>
                        {u.firstName} {u.lastName}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              )}
              <Col md={1}>
                <Form.Control
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                  title="Date début"
                />
              </Col>
              <Col md={1}>
                <Form.Control
                  type="date"
                  value={filters.dateFin}
                  onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                  title="Date fin"
                />
              </Col>
              <Col md={1}>
                <div className="d-flex gap-1">
                  <Button type="submit" variant="primary" size="sm">
                    <FaSearch />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleReset}>
                    ✕
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Tableau */}
      <Card className="shadow-sm border-0">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FaHistory size={48} className="mb-3 text-secondary" />
              <p className="mb-0">Aucun historique trouvé</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table striped hover>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Utilisateur</th>
                      <th>Type</th>
                      <th>Action</th>
                      <th>Détails</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <small>
                            {new Date(item.createdAt).toLocaleString('fr-FR')}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div 
                              className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-2"
                              style={{ width: '32px', height: '32px' }}
                            >
                              <small className="text-primary fw-bold">
                                {item.user?.firstName?.charAt(0)}{item.user?.lastName?.charAt(0)}
                              </small>
                            </div>
                            <div>
                              <div className="small">
                                <strong>
                                  {item.user?.firstName} {item.user?.lastName}
                                </strong>
                              </div>
                              <small className="text-muted">
                                @{item.user?.username}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{getEntityTypeBadge(item.entityType)}</td>
                        <td>{getActionBadge(item.action)}</td>
                        <td>{renderDetails(item)}</td>
                        <td>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => handleViewDetail(item._id)}
                            title="Voir les détails"
                          >
                            <FaEye />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Page {pagination.page} sur {pagination.pages} ({pagination.total} résultats)
                  </small>
                  <Pagination className="mb-0">
                    <Pagination.First 
                      onClick={() => loadHistory(1)} 
                      disabled={pagination.page === 1}
                    />
                    <Pagination.Prev 
                      onClick={() => loadHistory(pagination.page - 1)} 
                      disabled={pagination.page === 1}
                    />
                    
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.pages) return null;
                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === pagination.page}
                          onClick={() => loadHistory(pageNum)}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}
                    
                    <Pagination.Next 
                      onClick={() => loadHistory(pagination.page + 1)} 
                      disabled={pagination.page === pagination.pages}
                    />
                    <Pagination.Last 
                      onClick={() => loadHistory(pagination.pages)} 
                      disabled={pagination.page === pagination.pages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal Détail */}
      <Modal 
        show={showDetailModal} 
        onHide={() => setShowDetailModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaHistory className="me-2" />
            Détail de l'action
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEntry && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <small className="text-muted d-block">Date</small>
                  <strong>
                    {new Date(selectedEntry.createdAt).toLocaleString('fr-FR')}
                  </strong>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">Action</small>
                  {getActionBadge(selectedEntry.action)}
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={6}>
                  <small className="text-muted d-block">Utilisateur</small>
                  <div className="d-flex align-items-center">
                    <strong className="me-2">
                      {selectedEntry.user?.firstName} {selectedEntry.user?.lastName}
                    </strong>
                    {getRoleBadge(selectedEntry.user?.role)}
                  </div>
                  <small className="text-muted">
                    @{selectedEntry.user?.username} - {selectedEntry.user?.email}
                  </small>
                </Col>
                <Col md={6}>
                  <small className="text-muted d-block">Type d'entité</small>
                  {getEntityTypeBadge(selectedEntry.entityType)}
                </Col>
              </Row>

              {selectedEntry.action === 'STATUS_CHANGE' && (
                <Card className="bg-light border-0 mb-3">
                  <Card.Body>
                    <small className="text-muted d-block mb-2">Changement de statut</small>
                    <div className="d-flex align-items-center gap-3">
                      <div>
                        <small className="text-muted d-block">Ancien</small>
                        <Badge 
                          style={{ 
                            backgroundColor: selectedEntry.oldStatus?.color || '#6c757d',
                            fontSize: '14px'
                          }}
                        >
                          {selectedEntry.oldStatus?.label || 'N/A'}
                        </Badge>
                      </div>
                      <div style={{ fontSize: '24px' }}>→</div>
                      <div>
                        <small className="text-muted d-block">Nouveau</small>
                        <Badge 
                          style={{ 
                            backgroundColor: selectedEntry.newStatus?.color || '#6c757d',
                            fontSize: '14px'
                          }}
                        >
                          {selectedEntry.newStatus?.label || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {selectedEntry.changes && Object.keys(selectedEntry.changes).length > 0 && (
                <Card className="bg-light border-0 mb-3">
                  <Card.Body>
                    <small className="text-muted d-block mb-2">Modifications</small>
                    <Table size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Champ</th>
                          <th>Ancienne valeur</th>
                          <th>Nouvelle valeur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedEntry.changes).map(([key, val]) => (
                          <tr key={key}>
                            <td><strong>{key}</strong></td>
                            <td className="text-danger">
                              {String(val.old || '-')}
                            </td>
                            <td className="text-success">
                              {String(val.new || '-')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}

              {selectedEntry.comment && (
                <div className="mb-3">
                  <small className="text-muted d-block">Commentaire</small>
                  <p className="mb-0">{selectedEntry.comment}</p>
                </div>
              )}

              {selectedEntry.ipAddress && (
                <div className="mb-3">
                  <small className="text-muted d-block">Adresse IP</small>
                  <code>{selectedEntry.ipAddress}</code>
                </div>
              )}

              <div>
                <small className="text-muted d-block">ID de l'entité</small>
                <code>{selectedEntry.entityId}</code>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HistoryView;