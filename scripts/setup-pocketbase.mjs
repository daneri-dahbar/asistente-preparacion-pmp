import PocketBase from 'pocketbase';
import fs from 'node:fs';
import path from 'node:path';

loadEnvFile(path.resolve('.env.local'));

const PB_URL = process.env.PB_URL || process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    console.error('Error: Por favor define PB_ADMIN_EMAIL y PB_ADMIN_PASSWORD en las variables de entorno.');
    console.error('Ejemplo: PB_ADMIN_EMAIL=admin@email.com PB_ADMIN_PASSWORD=pass node scripts/setup-pocketbase.mjs');
    process.exit(1);
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

const USER_ROLES = ['usuario', 'admin'];
const DEFAULT_USER_ROLE = 'usuario';
const ADMIN_ROLE_RULE = '@request.auth.role = "admin"';
const OWNER_RULE = 'user = @request.auth.id';
const USER_SELF_RULE = 'id = @request.auth.id';
const USER_READ_RULE = `${ADMIN_ROLE_RULE} || ${USER_SELF_RULE}`;
const USER_UPDATE_RULE = `${USER_SELF_RULE} && (@request.body.role:isset = false || @request.body.role = role)`;
const OWNER_READ_RULE = `${ADMIN_ROLE_RULE} || ${OWNER_RULE}`;

async function authAsAdmin() {
    if (pb.admins?.authWithPassword) {
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
        return;
    }

    await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
}

async function main() {
    try {
        console.log(`Conectando a ${PB_URL}...`);
        await authAsAdmin();
        console.log('Autenticado como Admin.');

        await ensureUserRoles();
        await ensurePlatformReadRules();
        await ensureTechnicalMetricSnapshots();
        await ensureUxUiMetricSnapshots();
        await ensureUserResearchInstruments();
        await ensureUserResearchSessions();

        // 2. Chats Collection
        try {
            await pb.collections.create({
                name: 'chats',
                type: 'base',
                fields: [
                    {
                        name: 'title',
                        type: 'text',
                        required: true,
                    },
                    {
                        name: 'mode',
                        type: 'text',
                        required: true,
                    },
                    {
                        name: 'last_active',
                        type: 'date',
                        required: false,
                    },
                    {
                        name: 'user',
                        type: 'relation',
                        required: true,
                        collectionId: '_pb_users_auth_',
                        cascadeDelete: false,
                        maxSelect: 1,
                        displayFields: []
                    },
                ],
                listRule: 'user = @request.auth.id',
                viewRule: 'user = @request.auth.id',
                createRule: 'user = @request.auth.id',
                updateRule: 'user = @request.auth.id',
                deleteRule: 'user = @request.auth.id',
            });
            console.log('✅ Colección chats creada.');
        } catch (e) {
            console.log('ℹ️ Colección chats ya existe o error:', e.response?.data || e.message);
        }
        
        // Refetch collections to get IDs for relations
        const chatsCol = await pb.collections.getOne('chats').catch(() => null);

        // Re-attempt Chats creation/update if needed
        if (!chatsCol) {
            console.error('❌ Error: No se pudo crear/encontrar la colección chats.');
        } else {
             // We can check/update fields here if needed in future
        }
        
        const chatsColRefetched = chatsCol;

        // 3. Messages Collection
        // Need chat collection ID
        
        if (chatsColRefetched) {
             try {
                await pb.collections.create({
                    name: 'messages',
                    type: 'base',
                    fields: [
                        { name: 'content', type: 'text', required: true },
                        { name: 'role', type: 'text', required: true },
                        { name: 'generated_at', type: 'date', required: false },
                        { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
                        { name: 'chat', type: 'relation', collectionId: chatsColRefetched.id, maxSelect: 1 }
                    ],
                    listRule: 'user = @request.auth.id',
                    viewRule: 'user = @request.auth.id',
                    createRule: 'user = @request.auth.id',
                    updateRule: 'user = @request.auth.id',
                    deleteRule: 'user = @request.auth.id',
                });
                console.log('✅ Colección messages creada.');
            } catch (e) {
                console.log('ℹ️ Colección messages ya existe o error:', e.message);
            }
            await ensureMessageGeneratedAtField();
        }

        // 4. User Progress Collection
        try {
            await pb.collections.create({
                name: 'user_progress',
                type: 'base',
                fields: [
                    { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1, required: true },
                    { name: 'completed_levels', type: 'json' },
                    { name: 'stats', type: 'json' }
                ],
                listRule: 'user = @request.auth.id',
                viewRule: 'user = @request.auth.id',
                createRule: 'user = @request.auth.id',
                updateRule: 'user = @request.auth.id',
                deleteRule: 'user = @request.auth.id',
            });
            console.log('✅ Colección user_progress creada.');
        } catch (e) {
            console.log('ℹ️ Colección user_progress ya existe o error:', e.message);
        }

        // 5. Simulations Collection
        try {
            await pb.collections.create({
                name: 'simulations',
                type: 'base',
                fields: [
                    { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1, required: true },
                    { name: 'status', type: 'text' },
                    { name: 'type', type: 'text' },
                    { name: 'total_questions', type: 'number' },
                    { name: 'current_index', type: 'number' },
                    { name: 'questions', type: 'json' },
                    { name: 'answers', type: 'json' },
                    { name: 'score', type: 'number' }
                ],
                listRule: 'user = @request.auth.id',
                viewRule: 'user = @request.auth.id',
                createRule: 'user = @request.auth.id',
                updateRule: 'user = @request.auth.id',
                deleteRule: 'user = @request.auth.id',
            });
            console.log('✅ Colección simulations creada.');
        } catch (e) {
            console.log('ℹ️ Colección simulations ya existe o error:', e.message);
        }

        console.log('🎉 Configuración de base de datos completada.');

    } catch (error) {
        console.error('Error fatal:', error);
    }
}

main();

async function ensureUserRoles() {
    const usersCollection = await pb.collections.getOne('users');
    const roleField = usersCollection.fields.find((field) => field.name === 'role');
    const fields = roleField
        ? usersCollection.fields.map((field) => (
            field.name === 'role'
                ? {
                    ...field,
                    type: 'select',
                    required: false,
                    maxSelect: 1,
                    values: USER_ROLES,
                    hidden: false,
                }
                : field
        ))
        : [
            ...usersCollection.fields,
            {
                name: 'role',
                type: 'select',
                required: false,
                maxSelect: 1,
                values: USER_ROLES,
                hidden: false,
            },
        ];

    await pb.collections.update(usersCollection.id, {
        fields,
        listRule: USER_READ_RULE,
        viewRule: USER_READ_RULE,
        updateRule: USER_UPDATE_RULE,
    });

    const users = await pb.collection('users').getFullList({
        fields: 'id,email,role,emailVisibility',
    });

    let updatedCount = 0;
    for (const user of users) {
        const data = {};

        if (!USER_ROLES.includes(user.role)) {
            data.role = DEFAULT_USER_ROLE;
        }

        if (user.emailVisibility !== true) {
            data.emailVisibility = true;
        }

        if (Object.keys(data).length > 0) {
            await pb.collection('users').update(user.id, data);
            updatedCount += 1;
        }
    }

    console.log(`Usuarios configurados. ${updatedCount} usuario(s) actualizado(s) con rol valido y email publico.`);
}

async function ensurePlatformReadRules() {
    const ownedCollections = ['chats', 'messages', 'user_progress', 'simulations', 'technical_metric_snapshots', 'ux_ui_metric_snapshots'];

    for (const collectionName of ownedCollections) {
        const collection = await pb.collections.getOne(collectionName).catch(() => null);
        if (!collection) continue;

        await pb.collections.update(collection.id, {
            listRule: OWNER_READ_RULE,
            viewRule: OWNER_READ_RULE,
            createRule: OWNER_RULE,
            updateRule: OWNER_RULE,
            deleteRule: OWNER_RULE,
        });
    }

    console.log('Reglas de lectura admin configuradas para datos de plataforma.');
}

async function ensureTechnicalMetricSnapshots() {
    const usersCollection = await pb.collections.getOne('users');
    const existing = await pb.collections.getOne('technical_metric_snapshots').catch(() => null);
    const fields = [
        { name: 'user', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: true },
        { name: 'measured_at', type: 'date', required: true },
        { name: 'screen', type: 'text', required: false },
        { name: 'ttft_ms', type: 'number', required: false },
        { name: 'lcp_ms', type: 'number', required: false },
        { name: 'cls', type: 'number', required: false },
        { name: 'bundle_kb', type: 'number', required: false },
        { name: 'pocketbase_latency_ms', type: 'number', required: false },
        { name: 'streaming_chunks', type: 'number', required: false },
        { name: 'streaming_label', type: 'text', required: false },
        { name: 'metrics', type: 'json', required: false },
        { name: 'user_agent', type: 'text', required: false },
    ];
    const rules = {
        listRule: OWNER_READ_RULE,
        viewRule: OWNER_READ_RULE,
        createRule: OWNER_RULE,
        updateRule: ADMIN_ROLE_RULE,
        deleteRule: ADMIN_ROLE_RULE,
    };

    if (!existing) {
        await pb.collections.create({
            name: 'technical_metric_snapshots',
            type: 'base',
            fields,
            ...rules,
        });
        console.log('Coleccion technical_metric_snapshots creada.');
        return;
    }

    const mergedFields = [...existing.fields];
    for (const field of fields) {
        const index = mergedFields.findIndex((current) => current.name === field.name);
        if (index === -1) {
            mergedFields.push(field);
        } else {
            mergedFields[index] = { ...mergedFields[index], ...field };
        }
    }

    await pb.collections.update(existing.id, {
        fields: mergedFields,
        ...rules,
    });

    console.log('Coleccion technical_metric_snapshots configurada.');
}

async function ensureUxUiMetricSnapshots() {
    const usersCollection = await pb.collections.getOne('users');
    const existing = await pb.collections.getOne('ux_ui_metric_snapshots').catch(() => null);
    const fields = [
        { name: 'user', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: true },
        { name: 'measured_at', type: 'date', required: true },
        { name: 'context', type: 'text', required: false },
        { name: 'ease_of_use', type: 'number', required: true },
        { name: 'answer_quality', type: 'number', required: true },
        { name: 'response_speed', type: 'number', required: true },
        { name: 'exam_similarity', type: 'number', required: true },
        { name: 'average_likert', type: 'number', required: false },
        { name: 'nps', type: 'number', required: true },
        { name: 'nps_category', type: 'text', required: false },
        { name: 'friction_points', type: 'text', required: false },
        { name: 'comments', type: 'text', required: false },
        { name: 'metrics', type: 'json', required: false },
    ];
    const rules = {
        listRule: OWNER_READ_RULE,
        viewRule: OWNER_READ_RULE,
        createRule: OWNER_RULE,
        updateRule: OWNER_RULE,
        deleteRule: OWNER_RULE,
    };

    if (!existing) {
        await pb.collections.create({
            name: 'ux_ui_metric_snapshots',
            type: 'base',
            fields,
            ...rules,
        });
        console.log('Coleccion ux_ui_metric_snapshots creada.');
        return;
    }

    const mergedFields = [...existing.fields];
    for (const field of fields) {
        const index = mergedFields.findIndex((current) => current.name === field.name);
        if (index === -1) {
            mergedFields.push(field);
        } else {
            mergedFields[index] = { ...mergedFields[index], ...field };
        }
    }

    await pb.collections.update(existing.id, {
        fields: mergedFields,
        ...rules,
    });

    console.log('Coleccion ux_ui_metric_snapshots configurada.');
}

async function ensureMessageGeneratedAtField() {
    const collection = await pb.collections.getOne('messages').catch(() => null);
    if (!collection) return;

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
    console.log('Campo generated_at configurado en messages.');
}

async function ensureUserResearchSessions() {
    const usersCollection = await pb.collections.getOne('users');
    const instrumentsCollection = await pb.collections.getOne('user_research_instruments').catch(() => null);
    const existing = await pb.collections.getOne('user_research_sessions').catch(() => null);
    const fields = [
        { name: 'user', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: true },
        { name: 'admin', type: 'relation', collectionId: usersCollection.id, maxSelect: 1, required: false },
        ...(instrumentsCollection ? [{ name: 'instrument', type: 'relation', collectionId: instrumentsCollection.id, maxSelect: 1, required: false }] : []),
        { name: 'session_date', type: 'date', required: true },
        { name: 'session_type', type: 'text', required: true },
        { name: 'context', type: 'text', required: false },
        { name: 'feedback', type: 'text', required: true },
        { name: 'pain_points', type: 'json', required: false },
        { name: 'design_decisions', type: 'json', required: false },
        { name: 'nps', type: 'number', required: false },
        { name: 'usefulness_score', type: 'number', required: false },
        { name: 'usability_score', type: 'number', required: false },
        { name: 'follow_up', type: 'text', required: false },
        { name: 'evidence_tag', type: 'text', required: false },
    ];

    const rules = {
        listRule: ADMIN_ROLE_RULE,
        viewRule: ADMIN_ROLE_RULE,
        createRule: ADMIN_ROLE_RULE,
        updateRule: ADMIN_ROLE_RULE,
        deleteRule: ADMIN_ROLE_RULE,
    };

    if (!existing) {
        await pb.collections.create({
            name: 'user_research_sessions',
            type: 'base',
            fields,
            ...rules,
        });
        console.log('Coleccion user_research_sessions creada.');
        return;
    }

    const mergedFields = [...existing.fields];
    for (const field of fields) {
        const index = mergedFields.findIndex((current) => current.name === field.name);
        if (index === -1) {
            mergedFields.push(field);
        } else {
            mergedFields[index] = { ...mergedFields[index], ...field };
        }
    }

    await pb.collections.update(existing.id, {
        fields: mergedFields,
        ...rules,
    });

    console.log('Coleccion user_research_sessions configurada.');
}

async function ensureUserResearchInstruments() {
    const existing = await pb.collections.getOne('user_research_instruments').catch(() => null);
    const fields = [
        { name: 'title', type: 'text', required: true },
        { name: 'instrument_type', type: 'text', required: true },
        { name: 'objective', type: 'text', required: false },
        { name: 'target_profile', type: 'text', required: false },
        { name: 'questions', type: 'json', required: false },
        { name: 'scale_items', type: 'json', required: false },
        { name: 'instructions', type: 'text', required: false },
        { name: 'evidence_tag', type: 'text', required: false },
        { name: 'version', type: 'text', required: false },
        { name: 'status', type: 'text', required: false },
    ];
    const rules = {
        listRule: ADMIN_ROLE_RULE,
        viewRule: ADMIN_ROLE_RULE,
        createRule: ADMIN_ROLE_RULE,
        updateRule: ADMIN_ROLE_RULE,
        deleteRule: ADMIN_ROLE_RULE,
    };

    if (!existing) {
        await pb.collections.create({
            name: 'user_research_instruments',
            type: 'base',
            fields,
            ...rules,
        });
        console.log('Coleccion user_research_instruments creada.');
        return;
    }

    const mergedFields = [...existing.fields];
    for (const field of fields) {
        const index = mergedFields.findIndex((current) => current.name === field.name);
        if (index === -1) {
            mergedFields.push(field);
        } else {
            mergedFields[index] = { ...mergedFields[index], ...field };
        }
    }

    await pb.collections.update(existing.id, {
        fields: mergedFields,
        ...rules,
    });

    console.log('Coleccion user_research_instruments configurada.');
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
