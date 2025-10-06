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
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonTextarea,
  IonAlert
} from '@ionic/react';
import {
  person,
  save,
  checkmark,
  settings
} from 'ionicons/icons';

const Settings: React.FC = () => {
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerBio, setTrainerBio] = useState('');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const settings = localStorage.getItem('trainerSettings');
    if (settings) {
      const parsed = JSON.parse(settings);
      setTrainerName(parsed.name || '');
      setTrainerEmail(parsed.email || '');
      setTrainerPhone(parsed.phone || '');
      setTrainerBio(parsed.bio || '');
    }
  };

  const saveSettings = () => {
    if (!trainerName.trim()) {
      setAlertMessage('El nombre es obligatorio');
      setShowAlert(true);
      return;
    }

    const settings = {
      name: trainerName.trim(),
      email: trainerEmail.trim(),
      phone: trainerPhone.trim(),
      bio: trainerBio.trim(),
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('trainerSettings', JSON.stringify(settings));

    // Disparar evento personalizado para notificar cambios
    window.dispatchEvent(new CustomEvent('trainerSettingsUpdated', {
      detail: settings
    }));

    setAlertMessage('Configuración guardada exitosamente');
    setShowAlert(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonMenuButton menu="main-menu" />
          </IonButtons>
          <IonTitle>⚙️ Configuración</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="ion-padding">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={person} style={{ marginRight: '8px' }} />
                Información del Personal Trainer
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonItem>
                <IonLabel position="stacked">Nombre Completo *</IonLabel>
                <IonInput
                  value={trainerName}
                  onIonInput={(e) => setTrainerName(e.detail.value!)}
                  placeholder="Tu nombre completo"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Email</IonLabel>
                <IonInput
                  value={trainerEmail}
                  onIonInput={(e) => setTrainerEmail(e.detail.value!)}
                  placeholder="tu@email.com"
                  type="email"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Teléfono</IonLabel>
                <IonInput
                  value={trainerPhone}
                  onIonInput={(e) => setTrainerPhone(e.detail.value!)}
                  placeholder="+54 9 11 1234-5678"
                  type="tel"
                />
              </IonItem>

              <IonItem>
                <IonLabel position="stacked">Biografía</IonLabel>
                <IonTextarea
                  value={trainerBio}
                  onIonInput={(e) => setTrainerBio(e.detail.value!)}
                  placeholder="Cuéntanos sobre tu experiencia como personal trainer..."
                  rows={4}
                />
              </IonItem>

              <div style={{ padding: '1rem' }}>
                <IonButton
                  expand="block"
                  onClick={saveSettings}
                  disabled={!trainerName.trim()}
                >
                  <IonIcon icon={save} slot="start" />
                  Guardar Configuración
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={settings} style={{ marginRight: '8px' }} />
                Información de la App
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p>
                <strong>Versión:</strong> 1.0.0<br />
                <strong>Desarrollado con:</strong> Ionic + React + SQLite<br />
                <strong>Última actualización:</strong> {new Date().toLocaleDateString('es-AR')}
              </p>
            </IonCardContent>
          </IonCard>
        </div>

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Configuración"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonContent>
    </IonPage>
  );
};

export default Settings;
