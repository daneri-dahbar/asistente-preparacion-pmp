import PocketBase from 'pocketbase';
import { NextResponse } from 'next/server';

export const maxDuration = 300;

interface PlatformUser {
    id: string;
    role?: string;
}

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

const USAGE_COLLECTIONS = [
    { name: 'messages', label: 'Mensajes' },
    { name: 'chats', label: 'Chats' },
    { name: 'user_progress', label: 'Progreso guiado' },
    { name: 'simulations', label: 'Simulaciones' },
    { name: 'technical_metric_snapshots', label: 'Metricas tecnicas' },
    { name: 'ux_ui_metric_snapshots', label: 'Metricas UX/UI' },
    { name: 'user_research_sessions', label: 'Relevamientos UX' },
    { name: 'business_metric_snapshots', label: 'Metricas de negocio previas' },
];

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

async function deleteUserRecords(pb: PocketBase, collectionName: string, userId: string) {
    const records = await withPocketBaseRetry(`list ${collectionName}`, () => pb.collection(collectionName).getFullList<{ id: string }>({
        filter: `user="${userId}"`,
        fields: 'id',
        requestKey: null,
    })).catch(() => []);

    for (const record of records) {
        await withPocketBaseRetry(`delete ${collectionName}`, () => (
            pb.collection(collectionName).delete(record.id, { requestKey: null })
        ));
    }

    return records.length;
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
        const confirmation = typeof body.confirmation === 'string' ? body.confirmation.trim() : '';

        if (!userId) {
            return NextResponse.json({ error: 'Debes indicar un usuario.' }, { status: 400 });
        }

        if (confirmation !== 'LIMPIAR') {
            return NextResponse.json({ error: 'Debes confirmar escribiendo LIMPIAR.' }, { status: 400 });
        }

        const pb = new PocketBase(PB_URL);
        pb.autoCancellation(false);
        await authAsSuperuser(pb);

        const targetUser = await withPocketBaseRetry('get target user', () => pb.collection('users').getOne<PlatformUser>(userId, {
            fields: 'id,role',
            requestKey: null,
        }));

        const deleted: Record<string, { label: string; count: number }> = {};

        for (const collection of USAGE_COLLECTIONS) {
            deleted[collection.name] = {
                label: collection.label,
                count: await deleteUserRecords(pb, collection.name, targetUser.id),
            };
        }

        const total = Object.values(deleted).reduce((sum, item) => sum + item.count, 0);

        return NextResponse.json({
            userId: targetUser.id,
            deleted,
            total,
        });
    } catch (error) {
        console.error('Error cleaning user usage data:', error);
        const message = error instanceof Error ? error.message : 'No se pudieron limpiar los datos de uso.';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
