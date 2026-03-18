'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * 전역 Firebase 앱 초기화 로직
 * 서버 사이드 렌더링(SSR) 및 프리렌더링 시 발생할 수 있는 'window is not defined' 에러를 방지하기 위해 
 * 런타임 체크를 강화합니다.
 */
export function initializeFirebase() {
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
    const auth = getAuth(firebaseApp);
    
    // 이메일 템플릿 및 인증 페이지 언어를 한국어로 전역 설정
    auth.languageCode = 'ko';
    
    return {
      firebaseApp,
      auth,
      firestore: getFirestore(firebaseApp)
    };
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return {
      firebaseApp: null as any,
      auth: null as any,
      firestore: null as any
    };
  }
}

export function getSdks(firebaseApp: FirebaseApp) {
  if (!firebaseApp) return { auth: null as any, firestore: null as any };
  const auth = getAuth(firebaseApp);
  auth.languageCode = 'ko';
  return {
    auth,
    firestore: getFirestore(firebaseApp)
  };
}