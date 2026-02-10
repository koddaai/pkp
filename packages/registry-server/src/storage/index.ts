/**
 * Storage Module
 *
 * Exports storage implementations and factory function.
 */

export { createStorage } from "./interface.js";
export type { RegistryStorage, StorageConfig, PostgreSQLConfig } from "./interface.js";
export { InMemoryStorage } from "./memory.js";
export { PostgreSQLStorage } from "./postgresql.js";
