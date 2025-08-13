"use client";

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function AuthRequiredModal({ isOpen, onClose, locale }: AuthRequiredModalProps) {
  const t = useTranslations('authRequired');
  const router = useRouter();

  const handleSignIn = () => {
    router.push(`/${locale}/sign-in`);
    onClose();
  };

  const handleSignUp = () => {
    router.push(`/${locale}/sign-up`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSignIn}
            className="flex items-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            {t('signIn')}
          </Button>
          <Button
            onClick={handleSignUp}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {t('signUp')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}