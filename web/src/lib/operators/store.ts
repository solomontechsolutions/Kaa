/**
 * Kaa operator storage. Same posture as every other domain here: an
 * in-process store, per-process, resets on deploy — a development store,
 * never an operational one.
 *
 * Deliberately its own module, not a shared table with `lib/fieldops`. Kaa
 * and FieldOps are separate entities; the two employee rosters must not be
 * able to collide, even accidentally, by living in the same map.
 */

import type { KaaOperator } from "./types";
import { seedOperators } from "./seed";

interface Tables {
  operators: Map<string, KaaOperator>;
  employeeIdIndex: Map<string, string>;
  emailIndex: Map<string, string>;
}

const globalStore = globalThis as unknown as { __kaaOperators?: Tables };

function tables(): Tables {
  if (!globalStore.__kaaOperators) {
    const operators = new Map(seedOperators().map((row) => [row.id, row]));
    globalStore.__kaaOperators = {
      operators,
      employeeIdIndex: new Map([...operators.values()].map((row) => [row.employeeId.toLowerCase(), row.id])),
      emailIndex: new Map([...operators.values()].map((row) => [row.email.toLowerCase(), row.id])),
    };
  }
  return globalStore.__kaaOperators;
}

export function getOperator(id: string): KaaOperator | undefined {
  return tables().operators.get(id);
}

export function findOperatorByEmployeeId(employeeId: string): KaaOperator | undefined {
  const id = tables().employeeIdIndex.get(employeeId.trim().toLowerCase());
  return id ? tables().operators.get(id) : undefined;
}

export function findOperatorByEmail(email: string): KaaOperator | undefined {
  const id = tables().emailIndex.get(email.trim().toLowerCase());
  return id ? tables().operators.get(id) : undefined;
}

/** Accepts either an employee id or an email — whichever the sign-in form was given. */
export function findOperatorByIdentifier(identifier: string): KaaOperator | undefined {
  return findOperatorByEmployeeId(identifier) ?? findOperatorByEmail(identifier);
}

export function listOperators(): KaaOperator[] {
  return [...tables().operators.values()];
}

/** Test hook. */
export function __resetOperators() {
  globalStore.__kaaOperators = undefined;
}
