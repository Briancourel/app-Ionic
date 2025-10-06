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
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonAlert,
  IonSearchbar,
  IonChip,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonButtons,
  IonMenuButton
} from '@ionic/react';
import {
  add,
  search,
  person,
  call,
  mail,
  calendar,
  create,
  trash,
  checkmark,
  close,
  people,
  logoWhatsapp
} from 'ionicons/icons';
import DatabaseService, { Client } from '../services/DatabaseService';
import WhatsAppService from '../services/WhatsAppService';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [whatsappService] = useState(() => WhatsAppService.getInstance());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    birth_date: '',
    emergency_contact: '',
    notes: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchText]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await DatabaseService.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    if (!searchText) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.name.toLowerCase().includes(searchText.toLowerCase()) ||
        client.phone.includes(searchText) ||
        (client.email && client.email.toLowerCase().includes(searchText.toLowerCase()))
      );
      setFilteredClients(filtered);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadClients();
    event.detail.complete();
  };

  const openModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        phone: client.phone,
        email: client.email || '',
        birth_date: client.birth_date || '',
        emergency_contact: client.emergency_contact || '',
        notes: client.notes || ''
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        birth_date: '',
        emergency_contact: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      birth_date: '',
      emergency_contact: '',
      notes: ''
    });
  };

  const handleSave = async () => {
    console.log('handleSave called with:', formData);
    if (!formData.name.trim() || !formData.phone.trim()) {
      console.log('Validation failed: name or phone empty');
      return;
    }

    try {
      console.log('Attempting to save client...');
      if (editingClient) {
        console.log('Updating client:', editingClient.id);
        await DatabaseService.updateClient(editingClient.id!, formData);
      } else {
        console.log('Adding new client');
        await DatabaseService.addClient(formData);
      }
      console.log('Client saved, reloading...');
      await loadClients();

      // Disparar evento para notificar a otras páginas
      window.dispatchEvent(new CustomEvent('clientsUpdated'));

      closeModal();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (clientToDelete) {
      try {
        await DatabaseService.deleteClient(clientToDelete.id!);
        await loadClients();

        // Disparar evento para notificar a otras páginas
        window.dispatchEvent(new CustomEvent('clientsUpdated'));
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
    setShowDeleteAlert(false);
    setClientToDelete(null);
  };

  const handleSendWhatsApp = async (client: Client) => {
    try {
      const message = `¡Hola ${client.name}! 👋

Espero que estés muy bien. Te contacto desde la app de Personal Trainer para coordinar tu próxima sesión.

¿Te parece bien si coordinamos un horario? 

¡Saludos! 💪`;

      await whatsappService.sendCustomMessage(client, message);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getAge = (birthDate: string) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} años`;
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Clientes</IonTitle>
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
          <IonTitle>👥 Clientes</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="ion-padding">
          {/* Header con estadísticas */}
          <IonCard>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                    {clients.length}
                  </h2>
                  <p style={{ margin: 0, opacity: 0.8 }}>Clientes Registrados</p>
                </div>
                <IonIcon icon={people} size="large" color="primary" />
              </div>
            </IonCardContent>
          </IonCard>

          {/* Búsqueda */}
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value!)}
            placeholder="Buscar clientes..."
            showClearButton="focus"
          />

          {/* Lista de clientes */}
          <IonList>
            {filteredClients.map((client) => (
              <IonCard key={client.id}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ margin: '0 0 8px 0', fontSize: '1.2rem' }}>
                        {client.name}
                      </h2>

                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <IonIcon icon={call} size="small" style={{ marginRight: '8px', color: '#3880ff' }} />
                        <span>{client.phone}</span>
                      </div>

                      {client.email && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                          <IonIcon icon={mail} size="small" style={{ marginRight: '8px', color: '#2dd36f' }} />
                          <span>{client.email}</span>
                        </div>
                      )}

                      {client.birth_date && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                          <IonIcon icon={calendar} size="small" style={{ marginRight: '8px', color: '#ffc409' }} />
                          <span>{getAge(client.birth_date)}</span>
                        </div>
                      )}

                      {client.emergency_contact && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <IonIcon icon={call} size="small" style={{ marginRight: '8px', color: '#f04141' }} />
                          <span>Emergencia: {client.emergency_contact}</span>
                        </div>
                      )}

                      {client.notes && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', opacity: 0.7, fontStyle: 'italic' }}>
                          "{client.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <IonButton
                        size="small"
                        color="success"
                        fill="outline"
                        onClick={() => handleSendWhatsApp(client)}
                        title="Enviar mensaje por WhatsApp"
                      >
                        <IonIcon icon={logoWhatsapp} slot="start" />
                        WhatsApp
                      </IonButton>
                      <IonButton
                        size="small"
                        fill="outline"
                        onClick={() => openModal(client)}
                      >
                        <IonIcon icon={create} slot="icon-only" />
                      </IonButton>
                      <IonButton
                        size="small"
                        fill="outline"
                        color="danger"
                        onClick={() => handleDelete(client)}
                      >
                        <IonIcon icon={trash} slot="icon-only" />
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>

          {filteredClients.length === 0 && (
            <IonCard>
              <IonCardContent style={{ textAlign: 'center', padding: '2rem' }}>
                <IonIcon icon={people} size="large" color="medium" style={{ marginBottom: '1rem' }} />
                <h3>No hay clientes</h3>
                <p>Agrega tu primer cliente para comenzar</p>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        {/* FAB para agregar cliente */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => openModal()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Modal para agregar/editar cliente */}
        <IonModal isOpen={showModal} onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</IonTitle>
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
                <IonLabel position="stacked">Nombre *</IonLabel>
                <IonInput
                  value={formData.name}
                  onIonInput={(e) => setFormData({ ...formData, name: e.detail.value! })}
                  placeholder="Nombre completo"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Teléfono *</IonLabel>
                <IonInput
                  value={formData.phone}
                  onIonInput={(e) => setFormData({ ...formData, phone: e.detail.value! })}
                  placeholder="+54 9 11 1234-5678"
                  type="tel"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  value={formData.email}
                  onIonInput={(e) => setFormData({ ...formData, email: e.detail.value! })}
                  placeholder="cliente@email.com"
                  type="email"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Fecha de Nacimiento</IonLabel>
                <IonInput
                  value={formData.birth_date}
                  onIonInput={(e) => setFormData({ ...formData, birth_date: e.detail.value! })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Contacto de Emergencia</IonLabel>
                <IonInput
                  value={formData.emergency_contact}
                  onIonInput={(e) => setFormData({ ...formData, emergency_contact: e.detail.value! })}
                  placeholder="+54 9 11 1234-5678"
                  type="tel"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Notas</IonLabel>
                <IonTextarea
                  value={formData.notes}
                  onIonInput={(e) => setFormData({ ...formData, notes: e.detail.value! })}
                  placeholder="Información adicional sobre el cliente..."
                  rows={3}
                />
              </IonItem>
            </IonList>

            <div style={{ padding: '1rem' }}>
              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={!formData.name.trim() || !formData.phone.trim()}
              >
                <IonIcon icon={checkmark} slot="start" />
                {editingClient ? 'Actualizar' : 'Guardar'} Cliente
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert para confirmar eliminación */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar Eliminación"
          message={`¿Estás seguro de que quieres eliminar a ${clientToDelete?.name}? Esta acción no se puede deshacer.`}
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

export default Clients;
