'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './app';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider는 하이드레이션 오류를 방지하기 위해 
 * 서버와 클라이언트의 초기 렌더링 상태를 완벽하게 일치시킵니다.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [services, setServices] = useState<{
    firebaseApp: any;
    auth: any;
    firestore: any;
  } | null>(null);

  useEffect(() => {
    // 브라우저 마운트 직후에만 Firebase를 초기화하여 하이드레이션 불일치를 원천 차단합니다.
    const initializedServices = initializeFirebase();
    setServices(initializedServices);
  }, []);

  // 서버 및 클라이언트 첫 렌더링 시에는 항상 null 값을 전달하여 트리를 안정화합니다.
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
