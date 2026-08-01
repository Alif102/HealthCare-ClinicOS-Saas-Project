import { Role } from "@prisma/client";

import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/db";

const DEMO_PASSWORD = "DemoPass123!";

const demoUsers: Array<{
  name: string;
  email: string;
  role: Role;
  specialty?: string;
}> = [
  {
    name: "Ada Admin",
    email: "admin@demo-clinic.local",
    role: "ADMIN",
  },
  {
    name: "Rita Reception",
    email: "reception@demo-clinic.local",
    role: "RECEPTIONIST",
  },
  {
    name: "Dr. Dylan Doctor",
    email: "doctor@demo-clinic.local",
    role: "DOCTOR",
    specialty: "General Practice",
  },
  {
    name: "Pat Patient",
    email: "patient@demo-clinic.local",
    role: "PATIENT",
  },
];

async function ensureUser(input: {
  name: string;
  email: string;
  role: Role;
  specialty?: string;
  tenantId: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  let userId = existing?.id;

  if (!userId) {
    const result = await auth.api.signUpEmail({
      body: {
        name: input.name,
        email: input.email,
        password: DEMO_PASSWORD,
      },
    });

    userId = result.user.id;
  }

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: input.tenantId,
        userId,
      },
    },
    update: {
      role: input.role,
      status: "ACTIVE",
    },
    create: {
      tenantId: input.tenantId,
      userId,
      role: input.role,
      status: "ACTIVE",
    },
  });

  if (input.role === "DOCTOR") {
    await prisma.doctorProfile.upsert({
      where: { userId },
      update: {
        specialty: input.specialty ?? "General Practice",
        tenantId: input.tenantId,
      },
      create: {
        tenantId: input.tenantId,
        userId,
        specialty: input.specialty ?? "General Practice",
        bio: "Demo clinician for ClinicOS ThemeForest preview.",
        consultationFee: 75,
      },
    });
  }

  if (input.role === "PATIENT") {
    await prisma.patientProfile.upsert({
      where: { userId },
      update: {
        tenantId: input.tenantId,
        dateOfBirth: new Date("1992-04-18"),
        gender: "FEMALE",
        bloodType: "O+",
        phone: "+1-555-0142",
        emergencyContactName: "Sam Patient",
        emergencyContactPhone: "+1-555-0199",
        address: "42 Recovery Road, Demo City",
      },
      create: {
        tenantId: input.tenantId,
        userId,
        dateOfBirth: new Date("1992-04-18"),
        gender: "FEMALE",
        bloodType: "O+",
        phone: "+1-555-0142",
        emergencyContactName: "Sam Patient",
        emergencyContactPhone: "+1-555-0199",
        address: "42 Recovery Road, Demo City",
      },
    });
  }

  if (input.role !== "PATIENT") {
    await prisma.patientProfile.deleteMany({ where: { userId } });
  }

  return { email: input.email, role: input.role, userId };
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-clinic" },
    update: {
      name: "Demo Clinic",
      isActive: true,
    },
    create: {
      name: "Demo Clinic",
      slug: "demo-clinic",
      email: "hello@demo-clinic.local",
      phone: "+1-555-0100",
      timezone: "UTC",
      address: "100 Health Ave, Demo City",
    },
  });

  const seeded = [];
  for (const user of demoUsers) {
    seeded.push(
      await ensureUser({
        ...user,
        tenantId: tenant.id,
      }),
    );
  }

  const doctorUser = seeded.find((row) => row.role === "DOCTOR");
  const patientUser = seeded.find((row) => row.role === "PATIENT");
  let doctorProfileId: string | undefined;
  let patientProfileId: string | undefined;

  if (doctorUser) {
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUser.userId },
    });

    if (doctorProfile) {
      doctorProfileId = doctorProfile.id;
      const existingSlots = await prisma.doctorAvailability.count({
        where: { doctorProfileId: doctorProfile.id },
      });

      if (existingSlots === 0) {
        await prisma.doctorAvailability.createMany({
          data: [
            {
              tenantId: tenant.id,
              doctorProfileId: doctorProfile.id,
              dayOfWeek: "MONDAY",
              startTime: "09:00",
              endTime: "12:00",
              slotMinutes: 30,
            },
            {
              tenantId: tenant.id,
              doctorProfileId: doctorProfile.id,
              dayOfWeek: "WEDNESDAY",
              startTime: "13:00",
              endTime: "17:00",
              slotMinutes: 30,
            },
            {
              tenantId: tenant.id,
              doctorProfileId: doctorProfile.id,
              dayOfWeek: "FRIDAY",
              startTime: "09:00",
              endTime: "15:00",
              slotMinutes: 20,
            },
          ],
        });
      }
    }
  }

  if (patientUser) {
    const patientProfile = await prisma.patientProfile.findUnique({
      where: { userId: patientUser.userId },
    });
    patientProfileId = patientProfile?.id;
  }

  if (doctorProfileId && patientProfileId) {
    const existingAppointments = await prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        doctorProfileId,
        patientProfileId,
      },
    });

    let appointmentId: string | undefined;

    if (existingAppointments === 0) {
      // Next Monday 09:00–09:30 UTC
      const startAt = new Date();
      startAt.setUTCHours(9, 0, 0, 0);
      const day = startAt.getUTCDay();
      const daysUntilMonday = (1 - day + 7) % 7 || 7;
      startAt.setUTCDate(startAt.getUTCDate() + daysUntilMonday);
      const endAt = new Date(startAt.getTime() + 30 * 60_000);

      const appointment = await prisma.appointment.create({
        data: {
          tenantId: tenant.id,
          doctorProfileId,
          patientProfileId,
          startAt,
          endAt,
          status: "SCHEDULED",
          type: "IN_PERSON",
          reason: "Demo checkup",
        },
      });
      appointmentId = appointment.id;
    } else {
      const existing = await prisma.appointment.findFirst({
        where: {
          tenantId: tenant.id,
          doctorProfileId,
          patientProfileId,
        },
        orderBy: { startAt: "asc" },
        select: { id: true },
      });
      appointmentId = existing?.id;
    }

    const existingRx = await prisma.prescription.count({
      where: {
        tenantId: tenant.id,
        doctorProfileId,
        patientProfileId,
      },
    });

    if (existingRx === 0) {
      await prisma.prescription.create({
        data: {
          tenantId: tenant.id,
          doctorProfileId,
          patientProfileId,
          appointmentId: appointmentId ?? null,
          status: "ACTIVE",
          issuedAt: new Date(),
          notes: "Demo prescription for ThemeForest preview.",
          items: {
            create: [
              {
                medicationName: "Amoxicillin",
                dosage: "500mg",
                frequency: "Three times daily",
                duration: "7 days",
                instructions: "Take with food",
                quantity: 21,
              },
              {
                medicationName: "Ibuprofen",
                dosage: "200mg",
                frequency: "As needed",
                duration: "5 days",
                instructions: "For fever or pain",
                quantity: 10,
              },
            ],
          },
        },
      });
    }

    const existingAllergies = await prisma.allergy.count({
      where: { tenantId: tenant.id, patientProfileId },
    });
    if (existingAllergies === 0) {
      await prisma.allergy.create({
        data: {
          tenantId: tenant.id,
          patientProfileId,
          allergen: "Penicillin",
          reaction: "Rash and itching",
          severity: "moderate",
          notedAt: new Date("2024-06-01"),
        },
      });
    }

    const existingConditions = await prisma.medicalCondition.count({
      where: { tenantId: tenant.id, patientProfileId },
    });
    if (existingConditions === 0) {
      await prisma.medicalCondition.create({
        data: {
          tenantId: tenant.id,
          patientProfileId,
          name: "Seasonal asthma",
          status: "chronic",
          diagnosedAt: new Date("2019-03-12"),
          notes: "Triggered by pollen; uses rescue inhaler.",
        },
      });
    }

    if (appointmentId) {
      const existingEncounter = await prisma.encounter.count({
        where: { appointmentId },
      });
      if (existingEncounter === 0) {
        await prisma.encounter.create({
          data: {
            tenantId: tenant.id,
            appointmentId,
            doctorProfileId,
            patientProfileId,
            chiefComplaint: "Routine checkup and mild cough",
            assessment: "Viral upper respiratory symptoms; asthma stable.",
            plan: "Supportive care, continue inhaler PRN, follow up if worsens.",
            vitalsJson: {
              bloodPressure: "118/76",
              heartRate: "72",
              temperature: "98.4°F",
              weight: "64 kg",
            },
          },
        });
      }

      const existingInvoice = await prisma.invoice.count({
        where: { tenantId: tenant.id, appointmentId },
      });
      if (existingInvoice === 0) {
        const adminUser = seeded.find((row) => row.role === "ADMIN");
        const doctor = await prisma.doctorProfile.findUnique({
          where: { id: doctorProfileId },
          select: { consultationFee: true },
        });
        const subtotal = doctor?.consultationFee ?? 75;
        const dueAt = new Date();
        dueAt.setUTCDate(dueAt.getUTCDate() + 14);

        await prisma.invoice.create({
          data: {
            tenantId: tenant.id,
            patientProfileId,
            appointmentId,
            createdById: adminUser?.userId,
            invoiceNumber: `INV-${new Date().getUTCFullYear()}-0001`,
            status: "PENDING",
            subtotal,
            tax: 0,
            total: subtotal,
            currency: "USD",
            dueAt,
            notes: "Demo consultation fee for ThemeForest preview.",
          },
        });
      }
    }

    const existingVideo = await prisma.appointment.count({
      where: {
        tenantId: tenant.id,
        doctorProfileId,
        patientProfileId,
        type: "VIDEO",
      },
    });

    if (existingVideo === 0) {
      const startAt = new Date();
      startAt.setUTCHours(14, 0, 0, 0);
      const day = startAt.getUTCDay();
      const daysUntilWednesday = (3 - day + 7) % 7 || 7;
      startAt.setUTCDate(startAt.getUTCDate() + daysUntilWednesday);
      const endAt = new Date(startAt.getTime() + 30 * 60_000);

      const videoAppointment = await prisma.appointment.create({
        data: {
          tenantId: tenant.id,
          doctorProfileId,
          patientProfileId,
          startAt,
          endAt,
          status: "CONFIRMED",
          type: "VIDEO",
          reason: "Demo telehealth follow-up",
        },
      });

      const roomName = `clinicos-demo${videoAppointment.id.slice(-8)}`;
      await prisma.consultationSession.create({
        data: {
          tenantId: tenant.id,
          appointmentId: videoAppointment.id,
          roomName,
          joinUrl: `https://meet.jit.si/${roomName}`,
        },
      });
    }
  }

  if (doctorUser && patientUser) {
    const existingAlerts = await prisma.notification.count({
      where: {
        tenantId: tenant.id,
        channel: "IN_APP",
        userId: { in: [doctorUser.userId, patientUser.userId] },
      },
    });

    if (existingAlerts === 0) {
      await prisma.notification.createMany({
        data: [
          {
            tenantId: tenant.id,
            userId: doctorUser.userId,
            channel: "IN_APP",
            title: "Welcome to ClinicOS alerts",
            body: "You will see booking and visit updates here.",
            metadata: {
              event: "seed.welcome",
              href: "/notifications",
            },
          },
          {
            tenantId: tenant.id,
            userId: patientUser.userId,
            channel: "IN_APP",
            title: "Welcome to ClinicOS alerts",
            body: "Appointment, billing, and prescription updates appear here.",
            metadata: {
              event: "seed.welcome",
              href: "/notifications",
            },
          },
          {
            tenantId: tenant.id,
            userId: patientUser.userId,
            channel: "IN_APP",
            title: "Demo telehealth visit",
            body: "A video appointment is ready in your schedule.",
            metadata: {
              event: "video.room_ready",
              href: "/video",
            },
          },
        ],
      });
    }
  }

  console.log("Seeded tenant:", tenant.slug);
  console.log("Demo password for all users:", DEMO_PASSWORD);
  console.table(
    seeded.map((row) => ({
      email: row.email,
      role: row.role,
    })),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
