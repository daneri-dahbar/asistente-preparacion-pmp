import PocketBase from 'pocketbase';
import { NextResponse } from 'next/server';
import { UX_UI_METRIC_COLLECTION, buildUxUiMetricPayload, type UxUiMetricFormValues } from '@/lib/uxUiMetrics';

export const maxDuration = 60;

interface PlatformUser {
    id: string;
    role?: string;
}

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientPocketBaseError(error: unknown) {
    if (!error || typeof error !== 'object') return false;
    const maybeError = error as { status?: number; message?: string; originalError?: unknown };
    const message = String(maybeError.message || maybeError.originalError || '');

    return maybeError.status === 0
        || message.includes('fetch failed')
        || message.includes('ConnectTimeoutError')
        || message.includes('UND_ERR_CONNECT_TIMEOUT');
}

async function withPocketBaseRetry<T>(label: string, operation: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!isTransientPocketBaseError(error) || attempt === attempts) break;
            console.warn(`Reintentando operacion PocketBase (${label}) ${attempt + 1}/${attempts}`);
            await wait(750 * attempt);
        }
    }

    throw lastError;
}

async function authAsSuperuser(pb: PocketBase) {
    if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
        throw new Error('Faltan credenciales PB_ADMIN_EMAIL/PB_ADMIN_PASSWORD en el entorno del servidor.');
    }

    const maybeLegacyAdmin = pb as unknown as {
        admins?: { authWithPassword: (email: string, password: string) => Promise<unknown> };
    };

    if (maybeLegacyAdmin.admins?.authWithPassword) {
        await withPocketBaseRetry('auth legacy admin', () => maybeLegacyAdmin.admins!.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD));
        return;
    }

    await withPocketBaseRetry('auth superuser', () => pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD));
}

async function getAuthenticatedAdmin(token: string) {
    const authPb = new PocketBase(PB_URL);
    authPb.autoCancellation(false);
    authPb.authStore.save(token, null);

    const authData = await withPocketBaseRetry('refresh admin auth', () => authPb.collection('users').authRefresh());
    const admin = authData.record as unknown as PlatformUser;

    if (admin.role !== 'admin') {
        throw new Error('El usuario autenticado no tiene rol admin.');
    }

    return admin;
}

export async function POST(req: Request) {
    try {
        const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
        if (!token) {
            return NextResponse.json({ error: 'Falta token de autenticacion.' }, { status: 401 });
        }

        await getAuthenticatedAdmin(token);

        const body = await req.json();
        const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
        const values = body.values as UxUiMetricFormValues | undefined;

        if (!userId) {
            return NextResponse.json({ error: 'Debes indicar un usuario.' }, { status: 400 });
        }

        if (!values || typeof values !== 'object') {
            return NextResponse.json({ error: 'Debes indicar los valores de la medicion UX/UI.' }, { status: 400 });
        }

        const pb = new PocketBase(PB_URL);
        pb.autoCancellation(false);
        await authAsSuperuser(pb);

        const targetUser = await withPocketBaseRetry('get target user', () => pb.collection('users').getOne<PlatformUser>(userId, {
            fields: 'id,role',
            requestKey: null,
        }));

        if ((targetUser.role || 'usuario') !== 'usuario') {
            return NextResponse.json({ error: 'Las mediciones UX/UI solo pueden asociarse a usuarios aspirantes.' }, { status: 400 });
        }

        const payload = buildUxUiMetricPayload(targetUser.id, values);
        const record = await withPocketBaseRetry('create ux/ui metric', () => (
            pb.collection(UX_UI_METRIC_COLLECTION).create(payload, { requestKey: null })
        ));

        return NextResponse.json({ record });
    } catch (error) {
        console.error('Error generating UX/UI metric:', error);
        const message = error instanceof Error ? error.message : 'No se pudo guardar la medicion UX/UI.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
