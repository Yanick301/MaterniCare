import { useCallback, useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'default';
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const sendNotification = useCallback((title: string, body: string, icon = '/icon.png') => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      console.warn('Notifications non autorisées ou non supportées');
      return;
    }

    try {
      const n = new Notification(title, {
        body,
        icon,
        badge: icon,
        vibrate: [200, 100, 200],
      } as any);

      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la notification:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      // On ne demande pas automatiquement pour ne pas être intrusif
      // Mais on pourrait le faire au premier clic important
    }
  }, []);

  return { permission, requestPermission, sendNotification };
}
