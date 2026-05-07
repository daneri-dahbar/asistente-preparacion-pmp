#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

loadEnvFile(path.join(projectRoot, '.env.local'));

const PB_URL =
  process.env.PB_URL ||
  process.env.POCKETBASE_URL ||
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  'http://127.0.0.1:8090';

let authAttempted = false;
let pbInstance = null;

const tools = [
  {
    name: 'pocketbase_health',
    description: 'Check whether the configured PocketBase instance is reachable.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'pocketbase_list_collections',
    description: 'List PocketBase collections. Requires admin or superuser credentials when rules do not allow public access.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'pocketbase_get_collection',
    description: 'Get metadata for one PocketBase collection by name or id.',
    inputSchema: {
      type: 'object',
      required: ['collection'],
      properties: {
        collection: { type: 'string', description: 'Collection name or id.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'pocketbase_list_records',
    description: 'List records from a PocketBase collection.',
    inputSchema: {
      type: 'object',
      required: ['collection'],
      properties: {
        collection: { type: 'string' },
        page: { type: 'number', minimum: 1, default: 1 },
        perPage: { type: 'number', minimum: 1, maximum: 500, default: 50 },
        sort: { type: 'string' },
        filter: { type: 'string' },
        expand: { type: 'string' },
        fields: { type: 'string' },
        fullList: { type: 'boolean', default: false },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'pocketbase_get_record',
    description: 'Get one record from a PocketBase collection by id.',
    inputSchema: {
      type: 'object',
      required: ['collection', 'id'],
      properties: {
        collection: { type: 'string' },
        id: { type: 'string' },
        expand: { type: 'string' },
        fields: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'pocketbase_create_record',
    description: 'Create a record in a PocketBase collection.',
    inputSchema: {
      type: 'object',
      required: ['collection', 'data'],
      properties: {
        collection: { type: 'string' },
        data: { type: 'object', additionalProperties: true },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'pocketbase_update_record',
    description: 'Update a record in a PocketBase collection.',
    inputSchema: {
      type: 'object',
      required: ['collection', 'id', 'data'],
      properties: {
        collection: { type: 'string' },
        id: { type: 'string' },
        data: { type: 'object', additionalProperties: true },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'pocketbase_delete_record',
    description: 'Delete a record from a PocketBase collection.',
    inputSchema: {
      type: 'object',
      required: ['collection', 'id'],
      properties: {
        collection: { type: 'string' },
        id: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'pocketbase_whoami',
    description: 'Show current PocketBase auth state for this MCP server process.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
];

const toolHandlers = {
  async pocketbase_health() {
    const response = await fetch(`${PB_URL.replace(/\/$/, '')}/api/health`);
    const body = await response.json().catch(() => ({}));
    return {
      url: PB_URL,
      ok: response.ok,
      status: response.status,
      body,
    };
  },

  async pocketbase_list_collections() {
    const pb = await authenticate();
    return await pb.collections.getFullList({ sort: 'name' });
  },

  async pocketbase_get_collection(args) {
    const pb = await authenticate();
    requireString(args, 'collection');
    return await pb.collections.getOne(args.collection);
  },

  async pocketbase_list_records(args) {
    const pb = await authenticate();
    requireString(args, 'collection');
    const options = pick(args, ['sort', 'filter', 'expand', 'fields']);

    if (args.fullList) {
      return await pb.collection(args.collection).getFullList({
        batch: numberOrDefault(args.perPage, 200),
        ...options,
      });
    }

    return await pb.collection(args.collection).getList(
      numberOrDefault(args.page, 1),
      numberOrDefault(args.perPage, 50),
      options,
    );
  },

  async pocketbase_get_record(args) {
    const pb = await authenticate();
    requireString(args, 'collection');
    requireString(args, 'id');
    return await pb.collection(args.collection).getOne(args.id, pick(args, ['expand', 'fields']));
  },

  async pocketbase_create_record(args) {
    const pb = await authenticate();
    requireString(args, 'collection');
    requireObject(args, 'data');
    return await pb.collection(args.collection).create(args.data);
  },

  async pocketbase_update_record(args) {
    const pb = await authenticate();
    requireString(args, 'collection');
    requireString(args, 'id');
    requireObject(args, 'data');
    return await pb.collection(args.collection).update(args.id, args.data);
  },

  async pocketbase_delete_record(args) {
    const pb = await authenticate();
    requireString(args, 'collection');
    requireString(args, 'id');
    await pb.collection(args.collection).delete(args.id);
    return { deleted: true, collection: args.collection, id: args.id };
  },

  async pocketbase_whoami() {
    const pb = await authenticate();
    return {
      url: PB_URL,
      isValid: pb.authStore.isValid,
      tokenPresent: Boolean(pb.authStore.token),
      model: sanitizeAuthModel(pb.authStore.model),
    };
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let message;
  try {
    message = JSON.parse(trimmed);
  } catch (error) {
    write({
      jsonrpc: '2.0',
      error: { code: -32700, message: `Parse error: ${error.message}` },
      id: null,
    });
    return;
  }

  if (message.method?.startsWith('notifications/')) return;

  try {
    const result = await dispatch(message);
    write({ jsonrpc: '2.0', id: message.id, result });
  } catch (error) {
    write({
      jsonrpc: '2.0',
      id: message.id ?? null,
      error: {
        code: error.code || -32603,
        message: error.message || 'Internal error',
        data: error.data,
      },
    });
  }
});

async function dispatch(message) {
  switch (message.method) {
    case 'initialize':
      return {
        protocolVersion: message.params?.protocolVersion || '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
        },
        serverInfo: {
          name: 'asistente-preparacion-pmp-pocketbase',
          version: '0.1.0',
        },
      };

    case 'ping':
      return {};

    case 'tools/list':
      return { tools };

    case 'tools/call': {
      const name = message.params?.name;
      const handler = toolHandlers[name];
      if (!handler) throw rpcError(-32601, `Unknown tool: ${name}`);
      const value = await handler(message.params?.arguments || {});
      return toToolResult(value);
    }

    case 'resources/list':
      return {
        resources: [
          {
            uri: 'pocketbase://connection',
            name: 'PocketBase connection',
            description: 'Current PocketBase URL and auth state.',
            mimeType: 'application/json',
          },
        ],
      };

    case 'resources/read':
      if (message.params?.uri !== 'pocketbase://connection') {
        throw rpcError(-32602, `Unknown resource: ${message.params?.uri}`);
      }
      return {
        contents: [
          {
            uri: 'pocketbase://connection',
            mimeType: 'application/json',
            text: JSON.stringify(await toolHandlers.pocketbase_whoami(), null, 2),
          },
        ],
      };

    default:
      throw rpcError(-32601, `Unknown method: ${message.method}`);
  }
}

async function authenticate() {
  const pb = await getPocketBase();
  if (authAttempted) return pb;
  authAttempted = true;

  if (process.env.PB_AUTH_TOKEN) {
    pb.authStore.save(process.env.PB_AUTH_TOKEN, parseJsonEnv('PB_AUTH_MODEL') || null);
    return;
  }

  const adminEmail = process.env.PB_ADMIN_EMAIL || process.env.POCKETBASE_ADMIN_EMAIL;
  const adminPassword = process.env.PB_ADMIN_PASSWORD || process.env.POCKETBASE_ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (pb.admins?.authWithPassword) {
      await pb.admins.authWithPassword(adminEmail, adminPassword);
      return;
    }

    await pb.collection('_superusers').authWithPassword(adminEmail, adminPassword);
    return;
  }

  if (process.env.PB_AUTH_EMAIL && process.env.PB_AUTH_PASSWORD) {
    await pb.collection(process.env.PB_AUTH_COLLECTION || 'users').authWithPassword(
      process.env.PB_AUTH_EMAIL,
      process.env.PB_AUTH_PASSWORD,
    );
  }

  return pb;
}

async function getPocketBase() {
  if (pbInstance) return pbInstance;

  try {
    const { default: PocketBase } = await import('pocketbase');
    pbInstance = new PocketBase(PB_URL);
    return pbInstance;
  } catch (error) {
    throw rpcError(
      -32000,
      `No se pudo cargar el SDK de PocketBase. Ejecuta "npm install" en el proyecto antes de usar este MCP. Detalle: ${error.message}`,
    );
  }
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

function pick(source, keys) {
  return keys.reduce((result, key) => {
    if (source[key] !== undefined && source[key] !== '') result[key] = source[key];
    return result;
  }, {});
}

function numberOrDefault(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function requireString(args, key) {
  if (typeof args?.[key] !== 'string' || args[key].trim() === '') {
    throw rpcError(-32602, `Missing required string argument: ${key}`);
  }
}

function requireObject(args, key) {
  if (!args?.[key] || typeof args[key] !== 'object' || Array.isArray(args[key])) {
    throw rpcError(-32602, `Missing required object argument: ${key}`);
  }
}

function parseJsonEnv(key) {
  if (!process.env[key]) return null;
  try {
    return JSON.parse(process.env[key]);
  } catch {
    return null;
  }
}

function sanitizeAuthModel(model) {
  if (!model) return null;
  const { password, tokenKey, ...safeModel } = model;
  return safeModel;
}

function toToolResult(value) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function rpcError(code, message, data) {
  const error = new Error(message);
  error.code = code;
  error.data = data;
  return error;
}

function write(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}
