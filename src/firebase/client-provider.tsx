
'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './app';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider는 Firebase 서비스가 클라이언트에서만 초기화되도록 보장하며,
 * 서버와 클라이언트 간의 하이드레이션 불일치 및 라우팅 에러를 방지합니다.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [services, setServices] = useState<{
    firebaseApp: any;
    auth: any;
    firestore: any;
  } | null>(null);

  useEffect(() => {
    // 마운트 직후에만 Firebase를 초기화하여 SSR 결과와 일치시킵니다.
    const initializedServices = initializeFirebase();
    setServices(initializedServices);
    setIsMounted(true);
  }, []);

  // SSR 및 하이드레이션 중에는 null을 전달하여 트리를 안정화합니다.
  const app = isMounted ? services?.firebaseApp : null;
  const auth = isMounted ? services?.auth : null;
  const db = isMounted ? services?.firestore : null;

  return (
    <FirebaseProvider
      firebaseApp={app}
      auth={auth}
      firestore={db}
    >
      {children}
    </FirebaseProvider>
  );
}
