/**
 * A FieldOps operation mid-flight.
 *
 * The seed is not decoration — it is chosen so every state in the workflow is
 * on screen the first time anyone opens the portal: something waiting to be
 * reviewed, something that has been sent back and not yet answered, something
 * that came back a second time and was approved, something rejected, and a
 * draft still on a handset that Kaa cannot see.
 *
 * The properties are real Dar es Salaam wards at rents that are actually
 * asked there.
 */

import { DEMO_FIELDOPS_ADMIN, DEMO_FIELDOPS_OFFICER, DEMO_KAA_OPERATOR } from "@/lib/demo/credentials";
import type { Assignment, AuditEvent, FieldOfficer, PropertySubmission, SubmissionStatus } from "./types";

const HOUR = 3_600_000;

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * HOUR).toISOString();
}

function dateIn(days: number): string {
  return new Date(Date.now() + days * 24 * HOUR).toISOString().slice(0, 10);
}

export function seedOfficers(): FieldOfficer[] {
  return [
    {
      id: "fo-hamisi",
      employeeId: "FO-0142",
      fullName: "Hamisi Mwakalinga",
      phone: "+255784110142",
      role: "field_officer",
      assignedAreas: ["Mikocheni", "Kawe"],
      isActive: true,
      startedAt: "2025-11-03",
      lastActiveAt: hoursAgo(1),
      deviceId: "PDU-014",
    },
    {
      id: "fo-asha",
      employeeId: "FO-0155",
      fullName: "Asha Mbwana",
      phone: "+255712330155",
      role: "field_officer",
      assignedAreas: ["Sinza", "Mbezi"],
      isActive: true,
      startedAt: "2026-01-12",
      lastActiveAt: hoursAgo(3),
      deviceId: "PDU-027",
    },
    {
      id: "fo-musa",
      employeeId: "FO-0161",
      fullName: "Musa Kileo",
      phone: "+255689770161",
      role: "field_officer",
      assignedAreas: ["Tabata", "Mbagala"],
      isActive: true,
      startedAt: "2026-03-02",
      lastActiveAt: hoursAgo(26),
      deviceId: "PDU-031",
    },
    {
      id: "fo-neema",
      employeeId: "FO-0168",
      fullName: "Neema Shirima",
      phone: "+255754220168",
      role: "field_officer",
      assignedAreas: ["Msasani"],
      isActive: false,
      startedAt: "2026-02-17",
      lastActiveAt: hoursAgo(340),
      deviceId: "PDU-033",
    },
    {
      id: "fs-rehema",
      employeeId: "FS-0004",
      fullName: "Rehema Nassoro",
      phone: "+255766100004",
      role: "fieldops_supervisor",
      assignedAreas: ["Kinondoni", "Ubungo", "Ilala"],
      isActive: true,
      startedAt: "2025-09-01",
      lastActiveAt: hoursAgo(2),
    },
    {
      id: "ko-sarah",
      employeeId: "KAA-OPS-002",
      fullName: "Sarah Mushi",
      phone: "+255754000002",
      role: "kaa_operator",
      assignedAreas: [],
      isActive: true,
      startedAt: "2025-08-04",
      lastActiveAt: hoursAgo(1),
    },

    // ── Demo accounts, one per role, so a reviewer can sign in and try every
    //    portal without inventing credentials. Their employee ids match what
    //    the sign-in page and product spec both document.
    {
      id: "demo-fieldops-officer",
      employeeId: DEMO_FIELDOPS_OFFICER.employeeId,
      fullName: DEMO_FIELDOPS_OFFICER.fullName,
      phone: "+255700000103",
      role: "field_officer",
      assignedAreas: ["Mbezi", "Kawe"],
      isActive: true,
      startedAt: "2026-01-01",
      lastActiveAt: hoursAgo(2),
      deviceId: "PDU-DEMO",
    },
    {
      id: "demo-fieldops-admin",
      employeeId: DEMO_FIELDOPS_ADMIN.employeeId,
      fullName: DEMO_FIELDOPS_ADMIN.fullName,
      phone: "+255700000104",
      role: "fieldops_supervisor",
      assignedAreas: ["Kinondoni", "Ubungo", "Ilala", "Temeke", "Kigamboni"],
      isActive: true,
      startedAt: "2026-01-01",
      lastActiveAt: hoursAgo(2),
    },
    {
      id: "demo-kaa-operator",
      employeeId: DEMO_KAA_OPERATOR.employeeId,
      fullName: DEMO_KAA_OPERATOR.fullName,
      phone: "+255700000105",
      role: "kaa_operator",
      assignedAreas: [],
      isActive: true,
      startedAt: "2026-01-01",
      lastActiveAt: hoursAgo(2),
    },
  ];
}

let auditCounter = 0;

function event(
  submissionId: string,
  at: string,
  actor: { id: string; name: string; role: FieldOfficer["role"] },
  action: AuditEvent["action"],
  detail: string,
): AuditEvent {
  return {
    id: `evt-${++auditCounter}`,
    submissionId,
    at,
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action,
    detail,
  };
}

const HAMISI = { id: "fo-hamisi", name: "Hamisi Mwakalinga", role: "field_officer" as const };
const ASHA = { id: "fo-asha", name: "Asha Mbwana", role: "field_officer" as const };
const MUSA = { id: "fo-musa", name: "Musa Kileo", role: "field_officer" as const };
const SARAH = { id: "ko-sarah", name: "Sarah Mushi", role: "kaa_operator" as const };
const DEMO_OFFICER = {
  id: "demo-fieldops-officer",
  name: DEMO_FIELDOPS_OFFICER.fullName,
  role: "field_officer" as const,
};

interface Draft {
  id: string;
  reference: string;
  status: SubmissionStatus;
  officer: typeof HAMISI;
  ward: string;
  district: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  amenities: string[];
  photos: number;
  createdHoursAgo: number;
  submissionCount: number;
}

const DRAFTS: Draft[] = [
  {
    id: "sub-241", reference: "KA-000241", status: "UNDER_REVIEW", officer: ASHA,
    ward: "Mbezi", district: "Ubungo", area: "Mbezi Beach", bedrooms: 2, bathrooms: 2,
    rent: 480_000, amenities: ["parking", "security", "water_tank"], photos: 6,
    createdHoursAgo: 7, submissionCount: 1,
  },
  {
    id: "sub-240", reference: "KA-000240", status: "APPROVED", officer: HAMISI,
    ward: "Mikocheni", district: "Kinondoni", area: "Mikocheni B", bedrooms: 2, bathrooms: 2,
    rent: 700_000, amenities: ["parking", "security", "water_tank", "generator"], photos: 8,
    createdHoursAgo: 30, submissionCount: 1,
  },
  {
    id: "sub-239", reference: "KA-000239", status: "CORRECTION_REQUIRED", officer: MUSA,
    ward: "Tabata", district: "Ilala", area: "Tabata Segerea", bedrooms: 3, bathrooms: 2,
    rent: 450_000, amenities: ["parking", "water_tank"], photos: 4,
    createdHoursAgo: 26, submissionCount: 1,
  },
  {
    id: "sub-238", reference: "KA-000238", status: "APPROVED", officer: HAMISI,
    ward: "Kawe", district: "Kinondoni", area: "Kawe Beach", bedrooms: 1, bathrooms: 1,
    rent: 320_000, amenities: ["water_tank", "security"], photos: 5,
    createdHoursAgo: 54, submissionCount: 2,
  },
  {
    id: "sub-237", reference: "KA-000237", status: "UPLOADED", officer: ASHA,
    ward: "Sinza", district: "Ubungo", area: "Sinza Mori", bedrooms: 2, bathrooms: 1,
    rent: 380_000, amenities: ["parking", "luku"], photos: 5,
    createdHoursAgo: 4, submissionCount: 1,
  },
  {
    id: "sub-236", reference: "KA-000236", status: "REJECTED", officer: MUSA,
    ward: "Mbagala", district: "Temeke", area: "Mbagala Rangi Tatu", bedrooms: 2, bathrooms: 1,
    rent: 260_000, amenities: ["shared_water"], photos: 3,
    createdHoursAgo: 96, submissionCount: 1,
  },
  {
    id: "sub-242", reference: "KA-000242", status: "DRAFT", officer: HAMISI,
    ward: "Mikocheni", district: "Kinondoni", area: "Mikocheni A", bedrooms: 3, bathrooms: 2,
    rent: 950_000, amenities: ["parking", "security"], photos: 2,
    createdHoursAgo: 1, submissionCount: 0,
  },
  {
    // A correction already waiting on the demo field officer, so signing in
    // as them immediately demonstrates "receive a correction, fix it,
    // re-upload" rather than needing a fresh submission built from scratch.
    id: "sub-demo-243", reference: "KA-000243", status: "CORRECTION_REQUIRED", officer: DEMO_OFFICER,
    ward: "Mbezi", district: "Ubungo", area: "Mbezi Beach", bedrooms: 2, bathrooms: 1,
    rent: 340_000, amenities: ["water_tank", "security"], photos: 4,
    createdHoursAgo: 5, submissionCount: 1,
  },
];

export function seedSubmissions(): PropertySubmission[] {
  auditCounter = 0;

  return DRAFTS.map((draft) => {
    const created = hoursAgo(draft.createdHoursAgo);
    const uploaded = draft.submissionCount ? hoursAgo(draft.createdHoursAgo - 0.6) : undefined;

    const history: AuditEvent[] = [
      event(draft.id, created, draft.officer, "created", `${draft.officer.name} started ${draft.reference}`),
    ];
    if (uploaded) {
      history.push(
        event(draft.id, uploaded, draft.officer, "uploaded", `${draft.officer.name} uploaded ${draft.reference}`),
      );
    }

    const corrections: PropertySubmission["corrections"] = [];

    if (draft.status === "CORRECTION_REQUIRED") {
      const raisedAt = hoursAgo(draft.createdHoursAgo - 3);
      corrections.push({
        id: `cor-${draft.id}`,
        submissionId: draft.id,
        raisedBy: SARAH.id,
        raisedByName: SARAH.name,
        raisedAt,
        message:
          "Please correct the monthly rent. You entered TSh 450,000 but the landlord confirmed TSh 500,000 by phone. Also upload a clearer front-facing exterior photo — the current one is taken into the sun.",
        fields: ["monthlyRent", "photos.exterior"],
      });
      history.push(
        event(draft.id, hoursAgo(draft.createdHoursAgo - 2.5), SARAH, "opened_for_review", `${SARAH.name} opened ${draft.reference} for review`),
        event(draft.id, raisedAt, SARAH, "correction_requested", `${SARAH.name} requested a correction: rent and exterior photo`),
      );
    }

    if (draft.status === "APPROVED") {
      if (draft.submissionCount > 1) {
        const raisedAt = hoursAgo(draft.createdHoursAgo - 4);
        corrections.push({
          id: `cor-${draft.id}`,
          submissionId: draft.id,
          raisedBy: SARAH.id,
          raisedByName: SARAH.name,
          raisedAt,
          message: "GPS coordinates land in the wrong block. Please revisit and recapture the location at the gate.",
          fields: ["latitude", "longitude"],
          resolvedAt: hoursAgo(draft.createdHoursAgo - 8),
        });
        history.push(
          event(draft.id, raisedAt, SARAH, "correction_requested", `${SARAH.name} requested a correction: GPS`),
          event(draft.id, hoursAgo(draft.createdHoursAgo - 8), draft.officer, "resubmitted", `${draft.officer.name} resubmitted ${draft.reference} (attempt 2)`),
        );
      }
      history.push(
        event(draft.id, hoursAgo(draft.createdHoursAgo - 10), SARAH, "approved", `${SARAH.name} approved ${draft.reference} into Kaa`),
      );
    }

    if (draft.status === "REJECTED") {
      history.push(
        event(draft.id, hoursAgo(draft.createdHoursAgo - 12), SARAH, "rejected", `${SARAH.name} rejected ${draft.reference}: the unit was already let before the visit`),
      );
    }

    if (draft.status === "UNDER_REVIEW") {
      history.push(
        event(draft.id, hoursAgo(0.5), SARAH, "opened_for_review", `${SARAH.name} opened ${draft.reference} for review`),
      );
    }

    return {
      id: draft.id,
      reference: draft.reference,
      status: draft.status,
      officerId: draft.officer.id,
      officerName: draft.officer.name,
      property: {
        propertyKind: draft.bedrooms > 2 ? "house" : "apartment",
        houseType: "self_contained",
        bedrooms: draft.bedrooms,
        bathrooms: draft.bathrooms,
        monthlyRent: draft.rent,
        furnishing: "unfurnished",
        condition: "good",
        region: "Dar es Salaam",
        district: draft.district,
        ward: draft.ward,
        area: draft.area,
        street: `${draft.area} Road`,
        addressLine: `${draft.area}, ${draft.ward}`,
        landmark: `Near ${draft.area} market`,
        latitude: -6.75 + Math.random() * 0.2,
        longitude: 39.2 + Math.random() * 0.15,
        gpsAccuracyM: 6 + Math.round(Math.random() * 12),
        gpsCapturedAt: created,
        amenities: draft.amenities,
        parkingSpaces: draft.amenities.includes("parking") ? 1 : 0,
        water: draft.amenities.includes("water_tank") ? "piped_reliable" : "piped_intermittent",
        hasSecurity: draft.amenities.includes("security"),
        hasElectricity: true,
        landlordName: ["Ally Nassoro", "Grace Mollel", "Juma Salehe", "Fatma Ibrahim"][draft.bedrooms % 4],
        landlordPhone: `+2557${draft.reference.slice(-8)}`,
        landlordConsent: draft.status !== "DRAFT",
      },
      photos: Array.from({ length: draft.photos }, (_, index) => ({
        id: `${draft.id}-photo-${index}`,
        room: (["exterior", "living_room", "bedroom", "kitchen", "bathroom", "compound"] as const)[index % 6],
        uri: `seed://${draft.id}/${index}`,
        capturedAt: created,
        size: 180_000 + index * 20_000,
      })),
      createdAt: created,
      updatedAt: history[history.length - 1]!.at,
      uploadedAt: uploaded,
      reviewedAt: ["APPROVED", "REJECTED", "CORRECTION_REQUIRED"].includes(draft.status)
        ? history[history.length - 1]!.at
        : undefined,
      reviewedBy: ["APPROVED", "REJECTED", "CORRECTION_REQUIRED"].includes(draft.status) ? SARAH.id : undefined,
      reviewedByName: ["APPROVED", "REJECTED", "CORRECTION_REQUIRED"].includes(draft.status) ? SARAH.name : undefined,
      kaaUnitId: draft.status === "APPROVED" ? `unit-${draft.reference.toLowerCase()}` : undefined,
      submissionCount: draft.submissionCount,
      corrections,
      history: history.sort((a, b) => a.at.localeCompare(b.at)),
    } satisfies PropertySubmission;
  });
}

export function seedAssignments(): Assignment[] {
  return [
    { id: "asg-1", officerId: "fo-hamisi", ward: "Mikocheni", target: 12, collected: 8, dueOn: dateIn(3) },
    { id: "asg-2", officerId: "fo-hamisi", ward: "Kawe", target: 10, collected: 10, dueOn: dateIn(1) },
    { id: "asg-3", officerId: "fo-asha", ward: "Mbezi", target: 15, collected: 6, dueOn: dateIn(5) },
    { id: "asg-4", officerId: "fo-asha", ward: "Sinza", target: 10, collected: 3, dueOn: dateIn(6) },
    { id: "asg-5", officerId: "fo-musa", ward: "Tabata", target: 12, collected: 4, dueOn: dateIn(2), note: "Prioritise the Segerea end" },
    { id: "asg-6", officerId: "fo-musa", ward: "Mbagala", target: 8, collected: 1, dueOn: dateIn(8) },
  ];
}
