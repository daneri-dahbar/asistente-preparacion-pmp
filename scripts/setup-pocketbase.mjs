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
