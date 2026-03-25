import {
  getPermissionsHandler,
  requestPermissionsHandler,
  revokePermissionsHandler,
} from '@metamask/eip1193-permission-middleware';
import type { PermittedHandlerExport } from '@metamask/permission-controller';
import type { Json, JsonRpcParams } from '@metamask/utils';
import { makeMethodMiddlewareMaker } from '../utils';
import { eip1193OnlyHandlers } from '../handlers';

// The primary home of RPC method implementations for the injected 1193 provider API. MUST be subsequent
// to our permission logic in the EIP-1193 JSON-RPC middleware pipeline.
export const createEip1193MethodMiddleware = makeMethodMiddlewareMaker(
  [
    ...eip1193OnlyHandlers,
    // EIP-2255 Permission handlers
    getPermissionsHandler,
    requestPermissionsHandler,
    revokePermissionsHandler,
  ] as unknown as PermittedHandlerExport<Record<string, unknown>, JsonRpcParams, Json>[],
);
