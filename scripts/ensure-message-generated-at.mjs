import PocketBase from 'pocketbase';
import fs from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve('.env.local'));

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    console.error('Error: define PB_ADMIN_EMAIL y PB_ADMIN_PASSWORD en .env.local.');
    process.exit(1);
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

await authAsAdmin();
await ensureGeneratedAtField();
const result = await backfillGeneratedAt();

console.log(JSON.stringify(result, null, 2));

async function authAsAdmin() {
    try {
        await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
        return;
    } catch {
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
    }
}

async function ensureGeneratedAtField() {
    const collection = await pb.collections.getOne('messages');
    const fields = collection.fields.some((field) => field.name === 'generated_at')
        ? collection.fields.map((field) => (
            field.name === 'generated_at'
                ? { ...field, type: 'date', required: false, hidden: false }
                : field
        ))
        : [
            ...collection.fields,
            { name: 'generated_at', type: 'date', required: false, hidden: false },
        ];

    await pb.collections.update(collection.id, { fields });
}

async function backfillGeneratedAt() {
    const messages = await pb.collection('messages').getFullList({ requestKey: null });
    const chats = await pb.collection('chats').getFullList({ requestKey: null }).catch(() => []);
    const chatsById = new Map(chats.map((chat) => [chat.id, chat]));

    let updated = 0;
    let missingGeneratedAt = 0;
    const fallbackBase = new Date();

    for (const [index, message] of messages.entries()) {
        if (message.generated_at) continue;

        missingGeneratedAt += 1;

        const chat = chatsById.get(message.chat);
        const fallbackDate = message.created
            || message.updated
            || chat?.last_active
            || chat?.updated
            || new Date(fallbackBase.getTime() + index * 60000).toISOString();
        if (!fallbackDate) continue;

        await pb.collection('messages').update(message.id, {
            generated_at: fallbackDate,
        }, { requestKey: null });
        updated += 1;
    }

    return {
        totalMessages: messages.length,
        missingGeneratedAt,
        updatedMessages: updated,
    };
}

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const separator = trimmed.indexOf('=');
        if (separator === -1) continue;

        const key = trimmed.slice(0, separator).trim();
        let value = trimmed.slice(separator + 1).trim();
        if (!key || process.env[key] !== undefined) continue;

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        process.env[key] = value;
    }
}
