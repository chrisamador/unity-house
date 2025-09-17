/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth_actions from "../auth/actions.js";
import type * as auth_http from "../auth/http.js";
import type * as auth_utils from "../auth/utils.js";
import type * as auth_workos from "../auth/workos.js";
import type * as gpa_ai from "../gpa/ai.js";
import type * as gpa_courses from "../gpa/courses.js";
import type * as gpa_grades from "../gpa/grades.js";
import type * as gpa_users from "../gpa/users.js";
import type * as http from "../http.js";
import type * as user_mutations from "../user/mutations.js";
import type * as user_queries from "../user/queries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "auth/actions": typeof auth_actions;
  "auth/http": typeof auth_http;
  "auth/utils": typeof auth_utils;
  "auth/workos": typeof auth_workos;
  "gpa/ai": typeof gpa_ai;
  "gpa/courses": typeof gpa_courses;
  "gpa/grades": typeof gpa_grades;
  "gpa/users": typeof gpa_users;
  http: typeof http;
  "user/mutations": typeof user_mutations;
  "user/queries": typeof user_queries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
