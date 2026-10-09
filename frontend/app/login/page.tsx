'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Hash, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const [checking, setChecking] = useState(true);

  const backendLoginUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/auth/login`
    : 'http://localhost:5000/api/auth/login';

  useEffect(() => {
    api
      .getMe()
      .then(() => {
        router.push('/dashboard');
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router]);

  return (
    <div className="w-full max-w-md bg-discord-dark border border-discord-border rounded-2xl shadow-2xl p-8 text-center relative z-10">
      <div className="w-16 h-16 rounded-2xl bg-blurple text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blurple/25">
        <Hash className="w-9 h-9" />
      </div>

      <h2 className="text-2xl font-black text-white mb-2">Welcome Back</h2>
      <p className="text-sm text-discord-muted mb-6 leading-relaxed">
        Sign in via Discord to manage your servers, categories, channels, and permissions.
      </p>

      {errorParam && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2.5 text-left">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            {errorParam === 'missing_code'
              ? 'Authorization code was missing from Discord callback.'
              : errorParam === 'invalid_state'
              ? 'Invalid OAuth2 security state (CSRF verification failed).'
              : 'Discord authentication failed. Please check bot credentials and try again.'}
          </span>
        </div>
      )}

      {checking ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3 text-discord-muted">
          <div className="w-6 h-6 border-2 border-blurple border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Checking session...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <a
            href={backendLoginUrl}
            className="w-full py-3.5 px-6 rounded-xl bg-blurple hover:bg-blurple-hover active:bg-blurple text-white font-bold text-sm transition-all shadow-lg shadow-blurple/20 flex items-center justify-center gap-3"
          >
            <span>Continue with Discord</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <div className="pt-2 text-left space-y-2 text-xs text-discord-muted bg-discord-surface/40 p-4 rounded-xl border border-discord-border/50">
            <div className="flex items-center gap-2 text-discord-text font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Requires Manage Server permissions</span>
            </div>
            <div className="flex items-center gap-2 text-discord-text font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No self-bot tokens or password storage</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-discord-darkest flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blurple/10 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="w-8 h-8 border-3 border-blurple border-t-transparent rounded-full animate-spin" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
