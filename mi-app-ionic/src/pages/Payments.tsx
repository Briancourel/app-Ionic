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
  IonChip,
  IonBadge,
  IonDatetime,
  IonTextarea,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import {
  add,
  cash,
  checkmark,
  close,
  create,
  trash,
  warning,
  calendar,
  person,
  refresh,
  logoWhatsapp
} from 'ionicons/icons';
import DatabaseService, { Payment, Client } from '../services/DatabaseService';
import WhatsAppService from '../services/WhatsAppService';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [whatsappService] = useState(() => WhatsAppService.getInstance());

  // Form state
  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    due_date: '',
    payment_method: '',
    notes: ''
  });

  useEffect(() => {
    loadData();

    // Escuchar cambios en la base de datos
    const handleDataChange = () => {
      loadData();
    };

    // Escuchar eventos de actualización de clientes
    window.addEventListener('clientsUpdated', handleDataChange);
    window.addEventListener('paymentsUpdated', handleDataChange);

    return () => {
      window.removeEventListener('clientsUpdated', handleDataChange);
      window.removeEventListener('paymentsUpdated', handleDataChange);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, clientsData] = await Promise.all([
        DatabaseService.getPayments(),
        DatabaseService.getClients()
      ]);
      setPayments(paymentsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async (event: CustomEvent) => {
    await loadData();
    event.detail.complete();
  };

  const openModal = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        client_id: payment.client_id.toString(),
        amount: payment.amount.toString(),
        due_date: payment.due_date,
        payment_method: payment.payment_method || '',
        notes: payment.notes || ''
      });
    } else {
      setEditingPayment(null);
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      setFormData({
        client_id: '',
        amount: '',
        due_date: nextMonth.toISOString().split('T')[0],
        payment_method: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPayment(null);
    setFormData({
      client_id: '',
      amount: '',
      due_date: '',
      payment_method: '',
      notes: ''
    });
  };

  const handleSave = async () => {
    if (!formData.client_id || !formData.amount || !formData.due_date) {
      return;
    }

    try {
      const paymentData = {
        client_id: parseInt(formData.client_id),
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        payment_method: formData.payment_method || undefined,
        notes: formData.notes || undefined,
        status: 'pending' as const
      };

      if (editingPayment) {
        await DatabaseService.updatePayment(editingPayment.id!, paymentData);
      } else {
        await DatabaseService.addPayment(paymentData);
      }
      await loadData();

      // Disparar evento para notificar a otras páginas
      window.dispatchEvent(new CustomEvent('paymentsUpdated'));

      closeModal();
    } catch (error) {
      console.error('Error saving payment:', error);
    }
  };

  const handleMarkAsPaid = async (payment: Payment) => {
    try {
      await DatabaseService.markPaymentAsPaid(payment.id!, payment.payment_method || 'Efectivo');
      await loadData();

      // Disparar evento para notificar a otras páginas
      window.dispatchEvent(new CustomEvent('paymentsUpdated'));
    } catch (error) {
      console.error('Error marking payment as paid:', error);
    }
  };

  const handleMarkAsOverdue = async (payment: Payment) => {
    try {
      await DatabaseService.updatePayment(payment.id!, { status: 'overdue' });
      await loadData();

      // Disparar evento para notificar a otras páginas
      window.dispatchEvent(new CustomEvent('paymentsUpdated'));
    } catch (error) {
      console.error('Error marking payment as overdue:', error);
    }
  };

  const handleDelete = (payment: Payment) => {
    setPaymentToDelete(payment);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (paymentToDelete) {
      try {
        // Note: You might want to add a deletePayment method to DatabaseService
        await loadData();
      } catch (error) {
        console.error('Error deleting payment:', error);
      }
    }
    setShowDeleteAlert(false);
    setPaymentToDelete(null);
  };

  const handleSendWhatsApp = async (payment: Payment) => {
    const client = clients.find(c => c.id === payment.client_id);
    if (!client) {
      console.error('Client not found');
      return;
    }

    try {
      await whatsappService.sendPaymentReminder(payment, client);
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'danger';
      default: return 'medium';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagado';
      case 'pending': return 'Pendiente';
      case 'overdue': return 'Vencido';
      default: return status;
    }
  };

  const getStats = () => {
    const total = payments.length;
    const paid = payments.filter(p => p.status === 'paid').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const overdue = payments.filter(p => p.status === 'overdue').length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

    return { total, paid, pending, overdue, totalAmount, paidAmount };
  };

  const stats = getStats();

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonTitle>Pagos</IonTitle>
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
          <IonTitle>💳 Pagos</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="ion-padding">
          {/* Estadísticas */}
          <IonCard>
            <IonCardContent>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Resumen de Pagos</h2>
                <IonIcon icon={cash} size="large" color="primary" />
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
                      <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#2dd36f' }}>{stats.paid}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Pagados</p>
                    </div>
                  </IonCol>
                  <IonCol size="3">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#ffc409' }}>{stats.pending}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Pendientes</p>
                    </div>
                  </IonCol>
                  <IonCol size="3">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#f04141' }}>{stats.overdue}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Vencidos</p>
                    </div>
                  </IonCol>
                </IonRow>
                <IonRow>
                  <IonCol size="6">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#3880ff' }}>{formatCurrency(stats.totalAmount)}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Total</p>
                    </div>
                  </IonCol>
                  <IonCol size="6">
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#2dd36f' }}>{formatCurrency(stats.paidAmount)}</h3>
                      <p style={{ margin: 0, fontSize: '0.8rem' }}>Cobrado</p>
                    </div>
                  </IonCol>
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Lista de pagos */}
          <IonList>
            {payments.map((payment) => (
              <IonCard key={payment.id}>
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                          {payment.client_name}
                        </h2>
                        <IonChip color={getStatusColor(payment.status)} style={{ marginLeft: '8px' }}>
                          <IonLabel>{getStatusText(payment.status)}</IonLabel>
                        </IonChip>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <IonIcon icon={cash} size="small" style={{ marginRight: '8px', color: '#3880ff' }} />
                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{formatCurrency(payment.amount)}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                        <IonIcon icon={calendar} size="small" style={{ marginRight: '8px', color: '#2dd36f' }} />
                        <span>Vence: {formatDate(payment.due_date)}</span>
                      </div>

                      {payment.payment_method && (
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                          <IonIcon icon={person} size="small" style={{ marginRight: '8px', color: '#ffc409' }} />
                          <span>Método: {payment.payment_method}</span>
                        </div>
                      )}

                      {payment.notes && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', opacity: 0.7, fontStyle: 'italic' }}>
                          "{payment.notes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Botón de WhatsApp - Siempre visible */}
                      <IonButton
                        size="small"
                        color="success"
                        fill="outline"
                        onClick={() => handleSendWhatsApp(payment)}
                        title="Enviar recordatorio por WhatsApp"
                      >
                        <IonIcon icon={logoWhatsapp} slot="start" />
                        WhatsApp
                      </IonButton>

                      {/* Botones de estado según el estado actual */}
                      {payment.status === 'pending' && (
                        <>
                          <IonButton
                            size="small"
                            color="success"
                            onClick={() => handleMarkAsPaid(payment)}
                            title="Marcar como pagado"
                          >
                            <IonIcon icon={checkmark} slot="start" />
                            Pagado
                          </IonButton>
                          <IonButton
                            size="small"
                            color="warning"
                            fill="outline"
                            onClick={() => handleMarkAsOverdue(payment)}
                            title="Marcar como vencido"
                          >
                            <IonIcon icon={warning} slot="start" />
                            Vencido
                          </IonButton>
                        </>
                      )}

                      {payment.status === 'overdue' && (
                        <IonButton
                          size="small"
                          color="success"
                          onClick={() => handleMarkAsPaid(payment)}
                          title="Marcar como pagado"
                        >
                          <IonIcon icon={checkmark} slot="start" />
                          Pagado
                        </IonButton>
                      )}

                      {payment.status === 'paid' && (
                        <IonButton
                          size="small"
                          color="warning"
                          fill="outline"
                          onClick={() => handleMarkAsOverdue(payment)}
                          title="Marcar como vencido"
                        >
                          <IonIcon icon={warning} slot="start" />
                          Vencido
                        </IonButton>
                      )}

                      {/* Botones de edición y eliminación */}
                      <IonButton
                        size="small"
                        fill="outline"
                        onClick={() => openModal(payment)}
                        title="Editar pago"
                      >
                        <IonIcon icon={create} slot="start" />
                        Editar
                      </IonButton>

                      <IonButton
                        size="small"
                        color="danger"
                        fill="outline"
                        onClick={() => handleDelete(payment)}
                        title="Eliminar pago"
                      >
                        <IonIcon icon={trash} slot="start" />
                        Eliminar
                      </IonButton>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            ))}
          </IonList>

          {payments.length === 0 && (
            <IonCard>
              <IonCardContent style={{ textAlign: 'center', padding: '2rem' }}>
                <IonIcon icon={cash} size="large" color="medium" style={{ marginBottom: '1rem' }} />
                <h3>No hay pagos</h3>
                <p>Agrega el primer pago para comenzar</p>
              </IonCardContent>
            </IonCard>
          )}
        </div>

        {/* FAB para agregar pago */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={() => openModal()}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        {/* Modal para agregar/editar pago */}
        <IonModal isOpen={showModal} onDidDismiss={closeModal}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editingPayment ? 'Editar Pago' : 'Nuevo Pago'}</IonTitle>
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
                <IonLabel position="stacked">Monto *</IonLabel>
                <IonInput
                  value={formData.amount}
                  onIonInput={(e) => setFormData({ ...formData, amount: e.detail.value! })}
                  placeholder="5000"
                  type="number"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Fecha de Vencimiento *</IonLabel>
                <IonInput
                  value={formData.due_date}
                  onIonInput={(e) => setFormData({ ...formData, due_date: e.detail.value! })}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Método de Pago</IonLabel>
                <IonSelect
                  value={formData.payment_method}
                  onIonChange={(e) => setFormData({ ...formData, payment_method: e.detail.value })}
                  placeholder="Seleccionar método"
                >
                  <IonSelectOption value="Efectivo">Efectivo</IonSelectOption>
                  <IonSelectOption value="Transferencia">Transferencia</IonSelectOption>
                  <IonSelectOption value="Tarjeta">Tarjeta</IonSelectOption>
                  <IonSelectOption value="Mercado Pago">Mercado Pago</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Notas</IonLabel>
                <IonTextarea
                  value={formData.notes}
                  onIonInput={(e) => setFormData({ ...formData, notes: e.detail.value! })}
                  placeholder="Información adicional sobre el pago..."
                  rows={3}
                />
              </IonItem>
            </IonList>

            <div style={{ padding: '1rem' }}>
              <IonButton
                expand="block"
                onClick={handleSave}
                disabled={!formData.client_id || !formData.amount || !formData.due_date}
              >
                <IonIcon icon={checkmark} slot="start" />
                {editingPayment ? 'Actualizar' : 'Guardar'} Pago
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Alert para confirmar eliminación */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar Eliminación"
          message="¿Estás seguro de que quieres eliminar este pago?"
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

export default Payments;


