import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonSpinner,
  IonAlert,
  IonButtons,
  IonMenuButton
} from '@ionic/react';
import {
  people,
  cash,
  calendar,
  warning,
  checkmarkCircle,
  time,
  trendingUp
} from 'ionicons/icons';
import DatabaseService, { DashboardStats } from '../services/DatabaseService';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadDashboardData();

    // Escuchar cambios en la base de datos
    const handleDataChange = () => {
      loadDashboardData();
    };

    // Escuchar eventos de actualización
    window.addEventListener('clientsUpdated', handleDataChange);
    window.addEventListener('paymentsUpdated', handleDataChange);
    window.addEventListener('sessionsUpdated', handleDataChange);

    return () => {
      window.removeEventListener('clientsUpdated', handleDataChange);
      window.removeEventListener('paymentsUpdated', handleDataChange);
      window.removeEventListener('sessionsUpdated', handleDataChange);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');

      // Verificar si la base de datos está inicializada
      await DatabaseService.initializeDatabase();
      console.log('Database initialized');

      const statsData = await DatabaseService.getDashboardStats();
      console.log('Stats loaded:', statsData);

      setStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setAlertMessage(`Error al cargar los datos: ${error}`);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonMenuButton />
            </IonButtons>
            <IonTitle>Dashboard</IonTitle>
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
          <IonTitle>🏋️‍♂️ Personal Trainer</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="ion-padding">
          <h1>¡Bienvenido al Dashboard!</h1>

          {/* Estadísticas Principales */}
          <IonGrid>
            <IonRow>
              <IonCol size="6" size-md="3">
                <IonCard color="primary">
                  <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                          {stats?.total_clients || 0}
                        </h2>
                        <p style={{ margin: 0, opacity: 0.8 }}>Clientes</p>
                      </div>
                      <IonIcon icon={people} size="large" />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="6" size-md="3">
                <IonCard color="success">
                  <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                          {stats?.active_clients || 0}
                        </h2>
                        <p style={{ margin: 0, opacity: 0.8 }}>Activos</p>
                      </div>
                      <IonIcon icon={people} size="large" />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="6" size-md="3">
                <IonCard color="warning">
                  <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                          {stats?.overdue_payments || 0}
                        </h2>
                        <p style={{ margin: 0, opacity: 0.8 }}>Pagos Vencidos</p>
                      </div>
                      <IonIcon icon={warning} size="large" />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="6" size-md="3">
                <IonCard color="tertiary">
                  <IonCardContent>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold' }}>
                          {stats?.today_sessions || 0}
                        </h2>
                        <p style={{ margin: 0, opacity: 0.8 }}>Sesiones Hoy</p>
                      </div>
                      <IonIcon icon={calendar} size="large" />
                    </div>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>

            {/* Ingresos */}
            <IonRow>
              <IonCol size="12" size-md="6">
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={cash} style={{ marginRight: '8px' }} />
                      Ingresos Totales
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#2dd36f' }}>
                      {formatCurrency(stats?.total_revenue || 0)}
                    </h1>
                  </IonCardContent>
                </IonCard>
              </IonCol>

              <IonCol size="12" size-md="6">
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>
                      <IonIcon icon={cash} style={{ marginRight: '8px' }} />
                      Ingresos del Mes
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', color: '#3880ff' }}>
                      {formatCurrency(stats?.monthly_revenue || 0)}
                    </h1>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>

        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Error"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;