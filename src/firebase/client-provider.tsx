'use client';

import React, { useMemo, useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './app';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const firebaseServices = useMemo(() => {
    // Firebase 초기화 로직은 내부적으로 window 체크를 포함하고 있습니다.
    return initializeFirebase();
  }, []);

  /**
   * 하이드레이션 오류 방지:
   * 서버는 Firebase 인스턴스를 null로 렌더링합니다. 
   * 클라이언트에서도 첫 렌더링(하이드레이션) 시에는 동일하게 null을 전달하고, 
   * 마운트가 완료된(isMounted === true) 이후에만 실제 인스턴스를 주입합니다.
   */
  const app = isMounted ? firebaseServices.firebaseApp : null;
  const auth = isMounted ? firebaseServices.auth : null;
  const db = isMounted ? firebaseServices.firestore : null;

  return (
    <FirebaseProvider
      firebaseApp={app as any}
      auth={auth as any}
      firestore={db as any}
    >
      {children}
    </FirebaseProvider>
  );
}
