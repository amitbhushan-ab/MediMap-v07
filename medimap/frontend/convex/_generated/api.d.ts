/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai from "../ai.js";
import type * as clear from "../clear.js";
import type * as debugStock from "../debugStock.js";
import type * as medicines from "../medicines.js";
import type * as pharmacies from "../pharmacies.js";
import type * as pharmacist from "../pharmacist.js";
import type * as pharmacistAuth from "../pharmacistAuth.js";
import type * as pharmacistBills from "../pharmacistBills.js";
import type * as pharmacistCustomers from "../pharmacistCustomers.js";
import type * as pharmacistStock from "../pharmacistStock.js";
import type * as pharmacistSuppliers from "../pharmacistSuppliers.js";
import type * as prices from "../prices.js";
import type * as requests from "../requests.js";
import type * as seed from "../seed.js";
import type * as seedAdmin from "../seedAdmin.js";
import type * as seedAll from "../seedAll.js";
import type * as seedExtras from "../seedExtras.js";
import type * as seedPharmacies from "../seedPharmacies.js";
import type * as test from "../test.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  ai: typeof ai;
  clear: typeof clear;
  debugStock: typeof debugStock;
  medicines: typeof medicines;
  pharmacies: typeof pharmacies;
  pharmacist: typeof pharmacist;
  pharmacistAuth: typeof pharmacistAuth;
  pharmacistBills: typeof pharmacistBills;
  pharmacistCustomers: typeof pharmacistCustomers;
  pharmacistStock: typeof pharmacistStock;
  pharmacistSuppliers: typeof pharmacistSuppliers;
  prices: typeof prices;
  requests: typeof requests;
  seed: typeof seed;
  seedAdmin: typeof seedAdmin;
  seedAll: typeof seedAll;
  seedExtras: typeof seedExtras;
  seedPharmacies: typeof seedPharmacies;
  test: typeof test;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
