import { DEMO_LANDLORD, DEMO_ORG_ID } from "@/lib/demo/credentials";
import type { Landlord } from "./types";

export function seedLandlords(): Landlord[] {
  return [
    {
      id: "landlord-demo",
      fullName: DEMO_LANDLORD.fullName,
      phone: DEMO_LANDLORD.phone,
      email: DEMO_LANDLORD.email,
      orgId: DEMO_ORG_ID,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
}
