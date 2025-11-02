import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAdConsent, setAdConsent, shouldPromptForConsent } from './consent';

export default function SupportAdsManager() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Prompt on first visit or after 48h if denied
    if (shouldPromptForConsent()) setOpen(true);

    const onOpen = () => setOpen(true);
    window.addEventListener('supportAds:open', onOpen as EventListener);
    return () => window.removeEventListener('supportAds:open', onOpen as EventListener);
  }, []);

  useEffect(() => {
    // Close modal if already granted (e.g., from another tab)
    const onChanged = () => {
      if (getAdConsent() === 'granted') setOpen(false);
    };
    window.addEventListener('supportAds:changed', onChanged as EventListener);
    window.addEventListener('storage', onChanged);
    return () => {
      window.removeEventListener('supportAds:changed', onChanged as EventListener);
      window.removeEventListener('storage', onChanged);
    };
  }, []);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="rounded-2xl border-border/20 bg-card/90 backdrop-blur-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Support Emerald</AlertDialogTitle>
          <AlertDialogDescription>
            Enable privacy-friendly sponsored content to support Emerald. You can change this
            anytime in Settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => { setAdConsent('denied'); setOpen(false); }}>
            No thanks
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => { setAdConsent('granted'); setOpen(false); }}>
            Enable Ads
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

