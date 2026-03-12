'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from './app';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider는 하이드레이션 오류를 방지하기 위해 
 * 브라우저 마운트가 완료된 시점(useEffect) 이후에만 실제 콘텐츠를 렌더링합니다.
 * 이는 Grammarly와 같은 브라우저 확장 프로그램이 DOM을 변조하여 발생하는
 * 'Hydration Mismatch' 에러를 원천적으로 차단하는 가장 강력한 방법입니다.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [services, setServices] = useState<{
    firebaseApp: any;
    auth: any;
    firestore: any;
  } | null>(null);

  useEffect(() => {
    // 1. 브라우저 환경에 진입했음을 표시
    setIsMounted(true);
    
    // 2. Firebase 서비스 초기화
    const initializedServices = initializeFirebase();
    setServices(initializedServices);
  }, []);

  // 서버 사이드 렌더링 및 클라이언트 첫 하이드레이션 패스에서는 
  // 아무것도 렌더링하지 않음으로써 서버/클라이언트 간의 HTML 구조를 완벽하게 비웁니다.
  // 이 방식은 브라우저 확장 프로그램이 주입하는 속성들에 의한 충돌을 완벽히 무시합니다.
  if (!isMounted) {
    return null;
  }

  return (
    <FirebaseProvider
      firebaseApp={services?.firebaseApp || null}
      auth={services?.auth || null}
      firestore={services?.firestore || null}
    >
      {children}
    </FirebaseProvider>
  );
}
