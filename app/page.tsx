'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import pb from '@/lib/pocketbase';

export default function Home() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        // Si ya está logueado, redirigir a bienvenida.
        if (pb.authStore.isValid) {
            router.push('/welcome');
        }
    }, [router]);

    const finishLogin = async () => {
        if (!pb.authStore.isValid) {
            console.warn('Autenticación completada pero el token no es válido.');
            setLoading(false);
            return;
        }

        if (pb.authStore.model && pb.authStore.model.emailVisibility !== true) {
            try {
                const updatedUser = await pb.collection('users').update(pb.authStore.model.id, {
                    emailVisibility: true,
                }, { requestKey: null });
                pb.authStore.save(pb.authStore.token, updatedUser);
            } catch (error) {
                console.warn('No se pudo actualizar la visibilidad del email:', error);
            }
        }

        router.push('/welcome');
    };

    const loginWithEmail = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email.trim() || !password.trim()) {
            alert('Ingresa tu email y contraseña para continuar.');
            return;
        }

        setLoading(true);

        try {
            await pb.collection('users').authWithPassword(email.trim(), password);
            await finishLogin();
        } catch (error) {
            console.error('Error logging in with email:', error);
            alert(`Error al iniciar sesión: ${error instanceof Error ? error.message : String(error)}`);
            setLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setLoading(true);

        // Timeout de seguridad para evitar carga infinita.
        const timeout = setTimeout(() => {
            setLoading(false);
            alert('El proceso de inicio de sesión ha tardado demasiado. Por favor, inténtalo de nuevo.');
        }, 60000);

        try {
            console.log('Iniciando autenticación con Google...');
            const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' });
            clearTimeout(timeout);
            console.log('Autenticación completada:', authData);

            await finishLogin();
        } catch (error) {
            clearTimeout(timeout);
            console.error('Error logging in:', error);

            // Ignorar el error si el usuario canceló el popup manualmente.
            if (String(error).includes('popup')) {
                console.log('Popup cerrado por el usuario');
            } else {
                alert(`Error al iniciar sesión: ${error instanceof Error ? error.message : String(error)}`);
            }
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 dark:bg-gray-900">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-lg dark:bg-gray-700">
                <div className="text-center">
                    <div className="mb-6 flex justify-center">
                        <Image
                            src="/asistente-pmp-300.png"
                            alt="Asistente PMP Logo"
                            width={150}
                            height={150}
                            priority
                            className="h-auto w-auto"
                        />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        Asistente PMP
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Inicia sesión para continuar
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <form onSubmit={loginWithEmail} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoComplete="email"
                                disabled={loading}
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-800/60"
                                placeholder="tu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
                                disabled={loading}
                                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-800/60"
                                placeholder="Tu contraseña"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:bg-gray-500 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:disabled:bg-gray-300"
                        >
                            {loading ? 'Cargando...' : 'Iniciar sesión'}
                        </button>
                    </form>

                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600" />
                        <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-300">o</span>
                        <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600" />
                    </div>

                    <button
                        onClick={loginWithGoogle}
                        disabled={loading}
                        className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Cargando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Iniciar sesión con Google
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
