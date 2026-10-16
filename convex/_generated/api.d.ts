/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as data from "../data.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as importLocal from "../importLocal.js";
import type * as me from "../me.js";
import type * as profile from "../profile.js";
import type * as validators from "../validators.js";
import type * as verification from "../verification.js";
import type * as waitlist from "../waitlist.js";

import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  data: typeof data;
  helpers: typeof helpers;
  http: typeof http;
  importLocal: typeof importLocal;
  me: typeof me;
  profile: typeof profile;
  validators: typeof validators;
  verification: typeof verification;
  waitlist: typeof waitlist;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
