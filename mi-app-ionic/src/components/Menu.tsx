import React, { useState, useEffect } from 'react';
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonMenuToggle,
  IonAvatar,
  IonText
} from '@ionic/react';
import {
  home,
  people,
  cash,
  calendar,
  settings,
  help,
  information
} from 'ionicons/icons';

const Menu: React.FC = () => {
  const [trainerName, setTrainerName] = useState('Personal Trainer');

  useEffect(() => {
    loadTrainerName();

    // Escuchar evento personalizado de actualización de configuración
    const handleSettingsUpdate = () => {
      loadTrainerName();
    };

    window.addEventListener('trainerSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('trainerSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  const loadTrainerName = () => {
    const settings = localStorage.getItem('trainerSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      if (parsed.name) {
        setTrainerName(parsed.name);
      }
    }
  };

  const menuItems = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: home
    },
    {
      title: 'Clientes',
      url: '/clients',
      icon: people
    },
    {
      title: 'Pagos',
      url: '/payments',
      icon: cash
    },
    {
      title: 'Calendario',
      url: '/calendar',
      icon: calendar
    },
    {
      title: 'Configuración',
      url: '/settings',
      icon: settings
    }
  ];

  return (
    <IonMenu contentId="main-content" type="push" side="start" menuId="main-menu">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>🏋️‍♂️ Personal Trainer</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Perfil del entrenador */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 0',
          borderBottom: '1px solid var(--ion-color-light)',
          marginBottom: '1rem'
        }}>
          <IonAvatar style={{ marginRight: '1rem' }}>
            <img
              src="/favicon.png"
              alt="Personal Trainer"
            />
          </IonAvatar>
          <div>
            <IonText>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{trainerName}</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7 }}>
                Personal Trainer
              </p>
            </IonText>
          </div>
        </div>

        {/* Menú de navegación */}
        <IonList>
          {menuItems.map((item, index) => (
            <IonMenuToggle key={index} autoHide={false}>
              <IonItem
                button
                routerLink={item.url}
                routerDirection="none"
                style={{ marginBottom: '4px' }}
              >
                <IonIcon
                  icon={item.icon}
                  slot="start"
                  color="primary"
                />
                <IonLabel>{item.title}</IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>

        {/* Información adicional */}
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'var(--ion-color-light)',
          borderRadius: '8px'
        }}>
          <IonText>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>
              💡 Consejos
            </h4>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
              • Mantén actualizados los datos de tus clientes<br />
              • Revisa los pagos vencidos regularmente<br />
              • Programa recordatorios para las sesiones<br />
              • Usa WhatsApp para comunicarte con clientes
            </p>
          </IonText>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          opacity: 0.6
        }}>
          <IonText>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>
              Personal Trainer App v1.0
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonMenu>
  );
};

export default Menu;

