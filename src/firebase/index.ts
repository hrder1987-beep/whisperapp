'use client';

/**
 * Firebase 배럴 파일: 외부에서는 이 파일을 통해 모든 Firebase 기능을 참조합니다.
 * 내부 구현체인 app.ts를 통해 순환 참조를 방지합니다.
 */
export * from './app';
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
