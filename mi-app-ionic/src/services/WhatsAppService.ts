import { Client, Payment, Session } from './DatabaseService';

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'payment_reminder' | 'session_reminder' | 'custom';
}

class WhatsAppService {
  private static instance: WhatsAppService;

  // API gratuita para WhatsApp (puedes cambiar por otra)
  private readonly API_URL = 'https://api.whatsapp.com/send';

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Genera un mensaje de recordatorio de pago
   */
  generatePaymentReminderMessage(payment: Payment, client: Client): string {
    const amount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(payment.amount);

    const dueDate = new Date(payment.due_date).toLocaleDateString('es-AR');
    const today = new Date();
    const due = new Date(payment.due_date);
    const isOverdue = due < today;
    const daysOverdue = isOverdue ? Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    let urgencyMessage = '';
    if (isOverdue) {
      urgencyMessage = `⚠️ *PAGO VENCIDO* (${daysOverdue} días de atraso)\n\n`;
    } else {
      const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= 3) {
        urgencyMessage = `⏰ *Vence en ${daysUntilDue} días*\n\n`;
      }
    }

    return `🏋️‍♂️ *Hola ${client.name}!*

${urgencyMessage}Te recordamos que tienes un pago ${isOverdue ? 'vencido' : 'pendiente'}:

💰 *Monto:* ${amount}
📅 *Vencimiento:* ${dueDate}
${payment.payment_method ? `💳 *Método:* ${payment.payment_method}` : ''}

${payment.notes ? `📝 *Notas:* ${payment.notes}` : ''}

${isOverdue ? 'Por favor, regulariza tu pago lo antes posible.' : '¡Gracias por tu confianza!'} 🙏

---
*Personal Trainer App*`;
  }

  /**
   * Genera un mensaje de recordatorio de sesión
   */
  generateSessionReminderMessage(session: Session, client: Client): string {
    const sessionDate = new Date(session.session_date).toLocaleDateString('es-AR');
    const sessionTime = session.session_time;

    return `🏋️‍♂️ *Hola ${client.name}!*

Te recordamos que tienes una sesión programada:

📅 *Fecha:* ${sessionDate}
⏰ *Hora:* ${sessionTime}
${session.notes ? `📝 *Notas:* ${session.notes}` : ''}

¡Nos vemos pronto! 💪

---
*Personal Trainer App*`;
  }

  /**
   * Genera un mensaje personalizado
   */
  generateCustomMessage(client: Client, message: string): string {
    return `🏋️‍♂️ *Hola ${client.name}!*

${message}

---
*Personal Trainer App*`;
  }

  /**
   * Abre WhatsApp Web/App con el mensaje pre-escrito
   */
  async sendMessage(messageData: WhatsAppMessage): Promise<boolean> {
    try {
      // Limpiar el número de teléfono (remover espacios, guiones, etc.)
      const cleanPhone = messageData.to.replace(/\D/g, '');

      // Agregar código de país si no lo tiene (Argentina)
      const phoneWithCountryCode = cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`;

      // Codificar el mensaje para URL
      const encodedMessage = encodeURIComponent(messageData.message);

      // Crear URL de WhatsApp (usando wa.me que es más confiable)
      const whatsappUrl = `https://wa.me/${phoneWithCountryCode}?text=${encodedMessage}`;

      // Abrir en nueva ventana/pestaña
      if (typeof window !== 'undefined') {
        // Intentar abrir en app móvil primero, luego web
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
          // En móvil, intentar abrir la app directamente
          window.location.href = whatsappUrl;
        } else {
          // En desktop, abrir WhatsApp Web
          window.open(whatsappUrl, '_blank');
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return false;
    }
  }

  /**
   * Envía recordatorio de pago
   */
  async sendPaymentReminder(payment: Payment, client: Client): Promise<boolean> {
    const message = this.generatePaymentReminderMessage(payment, client);
    return this.sendMessage({
      to: client.phone,
      message,
      type: 'payment_reminder'
    });
  }

  /**
   * Envía recordatorio de sesión
   */
  async sendSessionReminder(session: Session, client: Client): Promise<boolean> {
    const message = this.generateSessionReminderMessage(session, client);
    return this.sendMessage({
      to: client.phone,
      message,
      type: 'session_reminder'
    });
  }

  /**
   * Envía mensaje personalizado
   */
  async sendCustomMessage(client: Client, message: string): Promise<boolean> {
    const formattedMessage = this.generateCustomMessage(client, message);
    return this.sendMessage({
      to: client.phone,
      message: formattedMessage,
      type: 'custom'
    });
  }

  /**
   * Valida si un número de teléfono es válido
   */
  isValidPhoneNumber(phone: string): boolean {
    const cleanPhone = phone.replace(/\D/g, '');
    // Número argentino: 10-11 dígitos (con o sin código de país)
    return cleanPhone.length >= 10 && cleanPhone.length <= 13;
  }

  /**
   * Formatea un número de teléfono para mostrar
   */
  formatPhoneNumber(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.startsWith('54')) {
      // Número con código de país
      const withoutCountry = cleanPhone.substring(2);
      if (withoutCountry.length === 10) {
        return `+54 ${withoutCountry.substring(0, 3)} ${withoutCountry.substring(3, 6)}-${withoutCountry.substring(6)}`;
      } else if (withoutCountry.length === 11) {
        return `+54 ${withoutCountry.substring(0, 2)} ${withoutCountry.substring(2, 5)}-${withoutCountry.substring(5)}`;
      }
    } else if (cleanPhone.length === 10) {
      return `${cleanPhone.substring(0, 3)} ${cleanPhone.substring(3, 6)}-${cleanPhone.substring(6)}`;
    } else if (cleanPhone.length === 11) {
      return `${cleanPhone.substring(0, 2)} ${cleanPhone.substring(2, 5)}-${cleanPhone.substring(5)}`;
    }

    return phone; // Retornar original si no se puede formatear
  }
}

export default WhatsAppService;
