import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LicenseState {
  isSetupComplete: boolean;
  isActivated: boolean;
  activationType: '14_days' | '1_month' | '1_year' | 'lifetime' | null;
  activationDate: string | null;
  expiryDate: string | null;
  setSetupComplete: (status: boolean) => void;
  activateSystem: (type: '14_days' | '1_month' | '1_year' | 'lifetime', expiry: string) => void;
  checkActivationStatus: () => void;
  deactivateSystem: () => void;
}

export const useLicenseStore = create<LicenseState>()(
  persist(
    (set, get) => ({
      isSetupComplete: false,
      isActivated: false,
      activationType: null,
      activationDate: null,
      expiryDate: null,
      setSetupComplete: (status) => set({ isSetupComplete: status }),
      activateSystem: (type, expiry) => set({
        isActivated: true,
        activationType: type,
        activationDate: new Date().toISOString(),
        expiryDate: expiry
      }),
      deactivateSystem: () => set({
        isActivated: false,
        activationType: null,
        activationDate: null,
        expiryDate: null
      }),
      checkActivationStatus: () => {
        const { isActivated, expiryDate, activationType, deactivateSystem } = get();
        if (isActivated && activationType !== 'lifetime' && expiryDate) {
          const now = new Date();
          const expiry = new Date(expiryDate);
          if (now > expiry) {
            deactivateSystem();
          }
        }
      }
    }),
    {
      name: 'license-storage-v3',
    }
  )
);
