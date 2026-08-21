import { hashPassword } from "@/lib/auth/password";
import { DEMO_KAA_OPERATOR } from "@/lib/demo/credentials";
import type { KaaOperator } from "./types";

export function seedOperators(): KaaOperator[] {
  return [
    {
      id: "demo-kaa-operator",
      employeeId: DEMO_KAA_OPERATOR.employeeId,
      fullName: DEMO_KAA_OPERATOR.fullName,
      email: DEMO_KAA_OPERATOR.email,
      passwordHash: hashPassword(DEMO_KAA_OPERATOR.password),
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
}
