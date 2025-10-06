import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonFab,
  IonFabButton,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonButtons,
  IonMenuButton,
  IonDatetime,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol,
  IonChip,
  IonBadge,
  IonSegment,
  IonSegmentButton
} from '@ionic/react';
import {
  add,
  calendar,
  time,
  person,
  checkmark,
  close,
  warning,
  refresh,
  create,
  trash,
  people,
  laptop,
  home
} from 'ionicons/icons';
import DatabaseService, { Session, Client } from '../services/DatabaseService';

const Calendar: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'all'>('today');
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<Session | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    session_date: '',
    session_time: '',
    duration: '',
    type: 'personal',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, viewMode]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, clientsData] = await Promise.all([
        DatabaseService.getSessions(),
        DatabaseService.getClients()
      ]);
      setSessions(sessionsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = sessions;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    switch (viewMode) {
      case 'today':
        filtered = filtered.filter(session => session.session_date === todayStr);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.session_date);
          return sessionDate >= weekStart && sessionDate <= weekEnd;
        });
        break;
      case 'all':
      default:
        // No filter
        break;
    }

    // Ordenar por fecha y hora
    filtered.sort((a, b) => {
      const dateA = new Date(`${a.session_date}T${a.session_time}`);
      const dateB = new Date(`${b.session_date}T${b.session_time}`);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredSessions(filtered);
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadData();
    event.detail.complete();
  };

  const openModal = (session?: Session) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        client_id: session.client_id.toString(),
        session_date: session.session_date,
        session_time: session.session_time,
        duration: session.duration.toString(),
        type: session.type,
        notes: session.notes || ''
      });
    } else {
      setEditingSession(null);
      const today = new Date();
      setFormData({
        client_id: '',
        session_date: today.toISOString().split('T')[0],
        session_time: '09:00',
        duration: '60',
        type: 'personal',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSession(null);
    setFormData({
      client_id: '',
      session_date: '',
      session_time: '',
      duration: '',
      type: 'personal',
      notes: ''
    });
  };

  const handleSave = async () => {
    if (!formData.client_id || !formData.session_date || !formData.session_time || !formData.duration) {
      return;
    }

    try {
      const sessionData = {
        client_id: parseInt(formData.client_id),
        session_date: formData.session_date,
        session_time: formData.session_time,
        duration: parseInt(formData.duration),
        type: formData.type as 'personal' | 'group' | 'online',
        status: 'scheduled' as const,
        notes: formData.notes || undefined
      };

      if (editingSession) {
        await DatabaseService.updateSession(editingSession.id!, sessionData);
      } else {
        await DatabaseService.addSession(sessionData);
      }
      await loadData();
      closeModal();
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const handleStatusChange = async (session: Session, newStatus: string) => {
    try {
      await DatabaseService.updateSession(session.id!, { status: newStatus as any });
      await loadData();
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  };

  const handleDelete = (session: Session) => {
    setSessionToDelete(session);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (sessionToDelete) {
      try {
        // Note: You might want to add a deleteSession method to DatabaseService
        await loadData();
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
    setShowDeleteAlert(false);
    setSessionToDelete(null);
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'scheduled': return 'primary';
      case 'cancelled': return 'medium';
      case 'no_show': return 'danger';
      default: return 'medium';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'scheduled': return 'Programada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'No asistió';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'personal': return person;
      case 'group': return people;
      case 'online': return laptop;
      default: return person;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'personal': return 'primary';
      case 'group': return 'secondary';
      case 'online': return 'tertiary';
      default: return 'primary';
    }
  };

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.session_date === today);
    const completed = todaySessions.filter(s => s.status === 'completed').length;
    const scheduled = todaySessions.filter(s => s.status === 'scheduled').length;
    const cancelled = todaySessions.filter(s => s.status === 'cancelled').length;

    return { total: todaySessions.length, completed, scheduled, cancelled };
  };

  const stats = getStats();

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Calendario</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton menu="main-menu" />
          </IonButtons>
          <IonTitle>📅 Calendario</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="ion-padding">
          {/* Estadísticas del día */}
          <IonCard>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Sesiones de Hoy</h2>
                <IonIcon icon={calendar} size="large" color="primary" />
              </div>
              <IonGrid>
                <IonRow>
                  <IonCol size="3">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{stats.total}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Total</p>
                    </div>
                  </IonCol>
                  <IonCol size="3">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#2dd36f' }}>{stats.completed}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Completadas</p>
                    </div>
                  </IonCol>
                  <IonCol size="3">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#3880ff' }}>{stats.scheduled}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Programadas</p>
                    </div>
                  </IonCol>
                  <IonCol size="3">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#f04141' }}>{stats.cancelled}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Canceladas</p>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Filtros de vista */}
          <IonSegment value={viewMode} onIonChange={(e) => setViewMode(e.detail.value as any)}>
            <IonSegmentButton value="today">
              <IonLabel>Hoy</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="week">
              <IonLabel>Esta Semana</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="all">
              <IonLabel>Todas</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* Lista de sesiones */}
          <IonList>
            {filteredSessions.map((session) => (
              <IonCard key={session.id}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                          {session.client_name}
                        </h2>
                        <IonChip color={getStatusColor(session.status)} style={{ marginLeft: '8px' }}>
                          <IonLabel>{getStatusText(session.status)}</IonLabel>
                        </IonChip>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <IonIcon icon={calendar} size="small" style={{ marginRight: '8px', color: '#3880ff' }} />
                        <span>{formatDate(session.session_date)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <IonIcon icon={time} size="small" style={{ marginRight: '8px', color: '#2dd36f' }} />
                        <span>{formatTime(session.session_time)} - {session.duration} min</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <IonIcon
                          icon={getTypeIcon(session.type)}
                          size="small"
                          style={{ marginRight: '8px', color: `var(--ion-color-${getTypeColor(session.type)})` }}
                        />
                        <span style={{ textTransform: 'capitalize' }}>{session.type}</span>
                      </div>

                      {session.notes && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', opacity: 0.7, fontStyle: 'italic' }}>
                          "{session.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {session.status === 'scheduled' && (
                        <>
                          <IonButton
                            size="small"
                            color="success"
                            onClick={() => handleStatusChange(session, 'completed')}
                          >
                            <IonIcon icon={checkmark} slot="icon-only" />
                          </IonButton>
                          <IonButton
                            size="small"
                            color="warning"
                            onClick={() => handleStatusChange(session, 'cancelled')}
                          >
                            <IonIcon icon={close} slot="icon-only" />
                          </IonButton>
                        </>
                      )}

                      <IonButton
                        size="small"
                        fill="outline"
                        onClick={() => openModal(session)}
                      >
                        <IonIcon icon={create} slot="icon-only" />
                      </IonButton>

                      <IonButton
                        size="small"
                        color="danger"
                        onClick={() => handleDelete(session)}
                      >
                        <IonIcon icon={trash} slot="icon-only" />
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>

          {filteredSessions.length === 0 && (
            <IonCard>
              <IonCardContent style={{ textAlign: 'center', padding: '2rem' }}>
                <IonIcon icon={calendar} size="large" color="medium" style={{ marginBottom: '1rem' }} />
                <h3>No hay sesiones</h3>
                <p>Agrega la primera sesión para comenzar</p>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        {/* FAB para agregar sesión */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => openModal()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Modal para agregar/editar sesión */}
        <IonModal isOpen={showModal} onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingSession ? 'Editar Sesión' : 'Nueva Sesión'}</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={closeModal}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel position="stacked">Cliente *</IonLabel>
                <IonSelect
                  value={formData.client_id}
                  onIonChange={(e) => setFormData({ ...formData, client_id: e.detail.value })}
                  placeholder="Seleccionar cliente"
                >
                  {clients.map((client) => (
                    <IonSelectOption key={client.id} value={client.id!.toString()}>
                      {client.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Fecha *</IonLabel>
                <IonInput
                  value={formData.session_date}
                  onIonInput={(e) => setFormData({ ...formData, session_date: e.detail.value! })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Hora *</IonLabel>
                <IonInput
                  value={formData.session_time}
                  onIonInput={(e) => setFormData({ ...formData, session_time: e.detail.value! })}
                  placeholder="HH:MM"
                  type="time"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Duración (minutos) *</IonLabel>
                <IonInput
                  value={formData.duration}
                  onIonInput={(e) => setFormData({ ...formData, duration: e.detail.value! })}
                  placeholder="60"
                  type="number"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Tipo de Sesión</IonLabel>
                <IonSelect
                  value={formData.type}
                  onIonChange={(e) => setFormData({ ...formData, type: e.detail.value })}
                  placeholder="Seleccionar tipo"
                >
                  <IonSelectOption value="personal">Personal</IonSelectOption>
                  <IonSelectOption value="group">Grupal</IonSelectOption>
                  <IonSelectOption value="online">Online</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Notas</IonLabel>
                <IonTextarea
                  value={formData.notes}
                  onIonInput={(e) => setFormData({ ...formData, notes: e.detail.value! })}
                  placeholder="Información adicional sobre la sesión..."
                  rows={3}
                />
              </IonItem>
            </IonList>

            <div style={{ padding: '1rem' }}>
              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={!formData.client_id || !formData.session_date || !formData.session_time || !formData.duration}
              >
                <IonIcon icon={checkmark} slot="start" />
                {editingSession ? 'Actualizar' : 'Guardar'} Sesión
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert para confirmar eliminación */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar Eliminación"
          message="¿Estás seguro de que quieres eliminar esta sesión?"
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Eliminar',
              role: 'destructive',
              handler: confirmDelete
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Calendar;
