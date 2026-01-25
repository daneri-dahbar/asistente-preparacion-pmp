import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    console.error('Error: Por favor define PB_ADMIN_EMAIL y PB_ADMIN_PASSWORD en las variables de entorno.');
    console.error('Ejemplo: PB_ADMIN_EMAIL=admin@email.com PB_ADMIN_PASSWORD=pass node scripts/setup-pocketbase.mjs');
    process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function main() {
    try {
        console.log(`Conectando a ${PB_URL}...`);
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
        console.log('Autenticado como Admin.');

        // 1. Study Sessions Collection
        try {
            await pb.collections.create({
                name: 'study_sessions',
                type: 'base',
                fields: [
                    {
                        name: 'name',
                        type: 'text',
                        required: true,
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
                    {
                        name: 'ended_at',
                        type: 'date',
                        required: false,
                    }
                ],
                listRule: 'user = @request.auth.id',
                viewRule: 'user = @request.auth.id',
                createRule: 'user = @request.auth.id',
                updateRule: 'user = @request.auth.id',
                deleteRule: 'user = @request.auth.id',
            });
            console.log('✅ Colección study_sessions creada.');
        } catch (e) {
            console.log('ℹ️ Colección study_sessions ya existe o error:', e.response?.data || e.message);
        }

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
                        name: 'user',
                        type: 'relation',
                        required: true,
                        collectionId: '_pb_users_auth_',
                        cascadeDelete: false,
                        maxSelect: 1,
                        displayFields: []
                    },
                    // We will add study_session later or try to fetch it first.
                    // To simplify, we can skip study_session relation in first creation if it depends on ID, 
                    // but we need it. Let's rely on fetching ID after study_sessions creation attempt.
                ],
                listRule: 'user = @request.auth.id',
                viewRule: 'user = @request.auth.id',
                createRule: 'user = @request.auth.id',
                updateRule: 'user = @request.auth.id',
                deleteRule: 'user = @request.auth.id',
            });
            // Note: Schema creation with relation requires valid collectionId. 
            // If the above fails due to 'study_sessions' not being an ID, we need to fetch it.
            // But let's assume for a script we might need to be more robust. 
            // I'll update the logic below to fetch IDs.
            console.log('⚠️ Intento inicial de chats (parcial).');
        } catch (e) {
            console.log('ℹ️ Colección chats ya existe o error:', e.response?.data || e.message);
        }
        
        // Refetch collections to get IDs for relations
        const studySessionsCol = await pb.collections.getOne('study_sessions').catch(() => null);
        const chatsCol = await pb.collections.getOne('chats').catch(() => null);

        if (!studySessionsCol) {
            console.error('❌ Error: No se pudo encontrar la colección study_sessions para establecer relaciones. Verifique los errores anteriores.');
            return;
        }

        // Re-attempt Chats creation/update if needed to ensure relation is correct
        // If chats didn't exist, create it fully now.
        // If it exists, update it.
        if (!chatsCol) {
             await pb.collections.create({
                name: 'chats',
                type: 'base',
                fields: [
                    { name: 'title', type: 'text', required: true },
                    { name: 'mode', type: 'text', required: true },
                    { name: 'user', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
                    { name: 'study_session', type: 'relation', collectionId: studySessionsCol.id, maxSelect: 1 }
                ],
                listRule: 'user = @request.auth.id',
                viewRule: 'user = @request.auth.id',
                createRule: 'user = @request.auth.id',
                updateRule: 'user = @request.auth.id',
                deleteRule: 'user = @request.auth.id',
            });
            console.log('✅ Colección chats creada correctamente.');
        } else {
            // Update existing chats collection to ensure fields are correct
            // Note: Updating fields usually requires sending all fields. 
            // We just ensure study_session field exists.
            // Simplified check:
            const hasStudySession = chatsCol.fields?.find(f => f.name === 'study_session');
            if (!hasStudySession) {
                 const newFields = [
                     ...chatsCol.fields,
                     { name: 'study_session', type: 'relation', collectionId: studySessionsCol.id, maxSelect: 1 }
                 ];
                 await pb.collections.update(chatsCol.id, { fields: newFields });
                 console.log('✅ Colección chats actualizada con relación study_session.');
            }
        }
        
        // Refresh chats col
        const chatsColRefetched = await pb.collections.getOne('chats').catch(() => null);

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
        }

        console.log('🎉 Configuración de base de datos completada.');

    } catch (error) {
        console.error('Error fatal:', error);
    }
}

main();
