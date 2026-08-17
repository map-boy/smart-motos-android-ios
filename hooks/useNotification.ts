import { useEffect } from 'react';
import { notificationService } from '@/services/notification';

export function useNotification() {
  useEffect(() => {
    notificationService.initialize();
    return () => {
      notificationService.cleanup();
    };
  }, []);
} 
 