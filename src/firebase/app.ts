'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * 전역 Firebase 앱 초기화 로직
 * 서버 사이드 렌더링(SSR) 및 프리렌더링 시 발생할 수 있는 'window is not defined' 또는 
 * 'Internal Server Error'를 방지하기 위해 window 체크와 에러 핸들링을 강화합니다.
 */
export function initializeFirebase() {
  // 클라이언트 환경이 아닌 경우(서버 렌더링) 빈 객체 반환
  if (typeof window === 'undefined') {
    return {
      firebaseApp: null as any,
      auth: null as any,
      firestore: null as any
    };
  }

  try {
    const apps = getApps();
    const firebaseApp = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
    
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: getFirestore(firebaseApp)
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // 폴백 처리
    return {
      firebaseApp: null as any,
      auth: null as any,
      firestore: null as any
    };
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!firebaseApp) return { auth: null as any, firestore: null as any };
  return {
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}
