import PocketBase from 'pocketbase';

// Use environment variable for PocketBase URL or default to local instance
const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090');

export default pb;
