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
    // 브라우저 마운트 직후에만 Firebase를 초기화합니다.
    // 이는 하이드레이션 단계에서 서버의 null 상태와 클라이언트의 상태를 일치시킵니다.
    const initializedServices = initializeFirebase();
    setServices(initializedServices);
    setIsMounted(true);
  }, []);

  // 마운트 전에는 서버와 동일하게 null 값을 전달하여 트리를 안정화합니다.
  const app = services?.firebaseApp || null;
  const auth = services?.auth || null;
  const db = services?.firestore || null;

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
