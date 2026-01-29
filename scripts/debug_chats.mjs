
import PocketBase from 'pocketbase';

const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL;
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD;

if (!PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
    console.error('Error: Por favor define PB_ADMIN_EMAIL y PB_ADMIN_PASSWORD en las variables de entorno.');
    process.exit(1);
}

const pb = new PocketBase(PB_URL);

async function main() {
    try {
        console.log(`Conectando a ${PB_URL}...`);
        await pb.admins.authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);
        console.log('Autenticado como Admin.');

        console.log('\n--- LISTADO DE TODOS LOS CHATS ---');
        const chats = await pb.collection('chats').getFullList({
            sort: '-created',
            expand: 'user'
        });

        if (chats.length === 0) {
            console.log('No se encontraron chats en la base de datos.');
        } else {
            console.log(`Se encontraron ${chats.length} chats:`);
            chats.forEach(chat => {
                const userName = chat.expand?.user?.name || chat.expand?.user?.email || 'Desconocido';
                const userId = chat.user;
                console.log(`- [${chat.id}] "${chat.title}" (Mode: ${chat.mode}) - User: ${userName} (${userId})`);
            });
        }

        console.log('\n--- LISTADO DE TODOS LOS USUARIOS ---');
        const users = await pb.collection('users').getFullList();
        users.forEach(u => {
             console.log(`- [${u.id}] ${u.name} (${u.email})`);
        });

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
