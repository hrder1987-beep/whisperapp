'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './app';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider는 Firebase 서비스가 클라이언트에서만 초기화되도록 보장하며,
 * 서버와 클라이언트 간의 하이드레이션 불일치를 방지하기 위해 초기화 시점을 마운트 이후로 지연시킵니다.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [services, setServices] = useState<{
    firebaseApp: any;
    auth: any;
    firestore: any;
  } | null>(null);

  useEffect(() => {
    // 컴포넌트가 클라이언트에 마운트된 직후에만 Firebase를 초기화합니다.
    const initializedServices = initializeFirebase();
    setServices(initializedServices);
    setIsMounted(true);
  }, []);

  /**
   * SSR 및 클라이언트의 첫 번째 하이드레이션 렌더링 중에는 null을 전달합니다.
   * 이는 서버에서 생성된 HTML과 클라이언트의 첫 번째 렌더링 결과가 완벽히 일치하도록 보장합니다.
   */
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
