# PocketBase MCP

Este proyecto incluye un servidor MCP local para consultar y administrar la base de datos PocketBase desde clientes compatibles con MCP.

## Configuracion

El servidor carga automaticamente `.env.local` desde la raiz del proyecto. Usa estas variables:

```env
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
# Tambien se acepta:
# POCKETBASE_URL=http://127.0.0.1:8090

# Opcional, recomendado para poder listar colecciones y administrar datos.
PB_ADMIN_EMAIL=admin@example.com
PB_ADMIN_PASSWORD=super-secret
# Tambien se aceptan POCKETBASE_ADMIN_EMAIL y POCKETBASE_ADMIN_PASSWORD.

# Alternativas opcionales:
# PB_AUTH_TOKEN=...
# PB_AUTH_MODEL={"id":"...","email":"..."}
# PB_AUTH_COLLECTION=users
# PB_AUTH_EMAIL=user@example.com
# PB_AUTH_PASSWORD=secret
```

`NEXT_PUBLIC_POCKETBASE_URL` ya existe en este proyecto. Las credenciales no deberian versionarse porque `.env*` esta ignorado por Git.

## Ejecutar

```bash
npm run mcp:pocketbase
```

## Herramientas disponibles

- `pocketbase_health`: verifica conexion con PocketBase.
- `pocketbase_list_collections`: lista colecciones.
- `pocketbase_get_collection`: obtiene metadatos de una coleccion.
- `pocketbase_list_records`: lista registros con `filter`, `sort`, `expand`, `fields`, `page` y `perPage`.
- `pocketbase_get_record`: obtiene un registro por id.
- `pocketbase_create_record`: crea un registro.
- `pocketbase_update_record`: actualiza un registro.
- `pocketbase_delete_record`: elimina un registro.
- `pocketbase_whoami`: muestra URL y estado de autenticacion del proceso MCP.

## Cliente MCP

El archivo `.mcp.json` de la raiz declara el servidor:

```json
{
  "mcpServers": {
    "pocketbase": {
      "command": "node",
      "args": ["mcp/pocketbase-mcp-server.mjs"]
    }
  }
}
```

Si tu cliente MCP no toma la ruta relativa desde la raiz del proyecto, usa la ruta absoluta del script.
