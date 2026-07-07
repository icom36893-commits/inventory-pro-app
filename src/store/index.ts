import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  settings: any;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: any) => Promise<void>;
  pendingAction: string | null;
  setPendingAction: (action: string | null) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {},
  isLoading: false,
  pendingAction: null,
  setPendingAction: (action) => set({ pendingAction: action }),
  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const data = await (window as any).api.settings.get();
      set({ settings: data || {}, isLoading: false });
      
      if (data && data.theme) {
        document.documentElement.setAttribute('data-theme', data.theme);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      set({ isLoading: false });
    }
  },
  updateSettings: async (data: any) => {
    try {
      await (window as any).api.settings.update(data);
      const newSettings = await (window as any).api.settings.get();
      set({ settings: newSettings });
      
      if (newSettings.theme) {
        document.documentElement.setAttribute('data-theme', newSettings.theme);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  }
}));

interface AuthState {
  user: any;
  isAuthenticated: boolean;
  login: (user: any) => void;
  logout: () => void;
  updateUser: (user: any) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: { name: 'المدير العام', role: 'admin', email: 'admin@system.com', phone: '0500000000', profileImage: null },
      isAuthenticated: true,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
      },
      updateUser: (updatedData) => set((state) => ({ user: { ...state.user, ...updatedData } })),
    }),
    {
      name: 'auth-storage-v2',
    }
  )
);

export interface AppNotification {
  id: number;
  text: string;
  type?: string;
  created_at?: string;
  time?: string; // For backward compatibility
  is_read: boolean;
  isRead?: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id'>) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  testSound: () => void;
  // Notification Preferences
  notifyLowStock: boolean;
  notifyNewSale: boolean;
  notifyNewPurchase: boolean;
  notifyDataBackup: boolean;
  updateNotificationSettings: (settings: Partial<{
    notifyLowStock: boolean;
    notifyNewSale: boolean;
    notifyNewPurchase: boolean;
    notifyDataBackup: boolean;
  }>) => void;
}

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // First tone (Ding)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);

    // Second tone (Dong)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.15);
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.7);

  } catch(e) {
    console.log('Audio error:', e);
  }
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      soundEnabled: true,
      notifyLowStock: true,
      notifyNewSale: true,
      notifyNewPurchase: true,
      notifyDataBackup: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      testSound: () => playNotificationSound(),
      updateNotificationSettings: (newSettings) => set((state) => ({ ...state, ...newSettings })),
      
      fetchNotifications: async () => {
        try {
          if ((window as any).api?.notifications) {
            const data = await (window as any).api.notifications.getAll();
            const unreadBefore = get().notifications.filter(n => !n.is_read && !n.isRead).length;
            const unreadAfter = data.filter((n: any) => !n.is_read).length;
            
            set({ notifications: data });
            
            // Play sound if new unread notifications arrived
            if (unreadAfter > unreadBefore && get().soundEnabled) {
               playNotificationSound();
            }
          }
        } catch (e) {
          console.error('Failed to fetch notifications', e);
        }
      },
      
      addNotification: async (notification) => {
        if ((window as any).api?.notifications) {
          await (window as any).api.notifications.add({
             text: notification.text,
             type: notification.type || 'general'
          });
          await get().fetchNotifications();
        }
      },
      markAllAsRead: async () => {
        if ((window as any).api?.notifications) {
          await (window as any).api.notifications.markAllAsRead();
          await get().fetchNotifications();
        }
      },
      markAsRead: async (id) => {
        if ((window as any).api?.notifications) {
          await (window as any).api.notifications.markAsRead(id);
          await get().fetchNotifications();
        }
      },
      clearAll: async () => {
        if ((window as any).api?.notifications) {
          await (window as any).api.notifications.clearAll();
          await get().fetchNotifications();
        }
      }
    }),
    {
      name: 'notification-storage-v3',
      partialize: (state) => ({ 
        soundEnabled: state.soundEnabled, 
        notifyLowStock: state.notifyLowStock, 
        notifyNewSale: state.notifyNewSale, 
        notifyNewPurchase: state.notifyNewPurchase, 
        notifyDataBackup: state.notifyDataBackup 
      }), // ONLY persist settings, not the notifications list!
    }
  )
);

export * from './permissions';
export * from './licenseStore';
