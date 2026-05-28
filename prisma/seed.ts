/**
 * Demo seed script — run with:
 *   cd apps/api && npx ts-node --esm prisma/seed.ts
 *   OR: npx tsx prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding demo data...\n');

  // ─── Locations ────────────────────────────────────────────────
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: 'loc-mumbai' },
      update: {},
      create: { id: 'loc-mumbai', name: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', lat: 19.076, lng: 72.877 },
    }),
    prisma.location.upsert({
      where: { id: 'loc-pune' },
      update: {},
      create: { id: 'loc-pune', name: 'Pune', district: 'Pune', state: 'Maharashtra', lat: 18.520, lng: 73.856 },
    }),
    prisma.location.upsert({
      where: { id: 'loc-nagpur' },
      update: {},
      create: { id: 'loc-nagpur', name: 'Nagpur', district: 'Nagpur', state: 'Maharashtra', lat: 21.145, lng: 79.088 },
    }),
  ]);
  console.log(`✅ ${locations.length} locations`);

  // ─── Users ────────────────────────────────────────────────────
  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@wetheyuva.org' },
    update: {},
    create: {
      email: 'admin@wetheyuva.org',
      name: 'Priya Sharma',
      role: 'ADMIN',
      status: 'ACTIVE',
      locationId: 'loc-mumbai',
      consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
    },
  });

  // Coordinators
  const coord1 = await prisma.user.upsert({
    where: { email: 'coord1@wetheyuva.org' },
    update: {},
    create: {
      email: 'coord1@wetheyuva.org',
      name: 'Rahul Desai',
      role: 'COORDINATOR',
      status: 'ACTIVE',
      locationId: 'loc-mumbai',
      consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
    },
  });

  const coord2 = await prisma.user.upsert({
    where: { email: 'coord2@wetheyuva.org' },
    update: {},
    create: {
      email: 'coord2@wetheyuva.org',
      name: 'Sneha Patil',
      role: 'COORDINATOR',
      status: 'ACTIVE',
      locationId: 'loc-pune',
      consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
    },
  });

  // Observer
  const observer = await prisma.user.upsert({
    where: { email: 'observer@wetheyuva.org' },
    update: {},
    create: {
      email: 'observer@wetheyuva.org',
      name: 'Amit Joshi',
      role: 'OBSERVER',
      status: 'ACTIVE',
      locationId: 'loc-nagpur',
      consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
    },
  });

  // Volunteers
  const volunteers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'vol1@wetheyuva.org' },
      update: {},
      create: {
        email: 'vol1@wetheyuva.org',
        name: 'Arjun Mehta',
        role: 'VOLUNTEER',
        status: 'ACTIVE',
        consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
        profile: {
          create: {
            skills: ['Teaching', 'Communication', 'Leadership'],
            interests: ['Education', 'Community'],
            availability: { days: ['Sat', 'Sun'], timeSlots: ['Morning', 'Afternoon'] },
            bio: 'Passionate about education and community development.',
            totalHours: 12,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'vol2@wetheyuva.org' },
      update: {},
      create: {
        email: 'vol2@wetheyuva.org',
        name: 'Kavya Nair',
        role: 'VOLUNTEER',
        status: 'ACTIVE',
        consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
        profile: {
          create: {
            skills: ['Design', 'Photography', 'Social Media'],
            interests: ['Arts', 'Environment'],
            availability: { days: ['Sat'], timeSlots: ['Afternoon', 'Evening'] },
            bio: 'Creative professional who loves giving back.',
            totalHours: 8,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'vol3@wetheyuva.org' },
      update: {},
      create: {
        email: 'vol3@wetheyuva.org',
        name: 'Rohan Kulkarni',
        role: 'VOLUNTEER',
        status: 'ACTIVE',
        consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
        profile: {
          create: {
            skills: ['Coding', 'Data Analysis', 'Teaching'],
            interests: ['Technology', 'Education'],
            availability: { days: ['Sun'], timeSlots: ['Morning'] },
            bio: 'Software engineer volunteering on weekends.',
            totalHours: 20,
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'vol4@wetheyuva.org' },
      update: {},
      create: {
        email: 'vol4@wetheyuva.org',
        name: 'Meera Iyer',
        role: 'VOLUNTEER',
        status: 'ACTIVE',
        consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
        profile: {
          create: {
            skills: ['Healthcare', 'First Aid', 'Communication'],
            interests: ['Health', 'Community'],
            availability: { days: ['Sat', 'Sun'], timeSlots: ['Morning'] },
            bio: 'Nursing student passionate about community health.',
            totalHours: 5,
          },
        },
      },
    }),
  ]);
  console.log(`✅ ${2 + 2 + volunteers.length} users (1 admin, 2 coordinators, 1 observer, ${volunteers.length} volunteers)`);

  // ─── Opportunities ────────────────────────────────────────────
  const now = new Date();
  const future = (days: number) => new Date(now.getTime() + days * 86400000).toISOString();

  const opps = await Promise.all([
    prisma.opportunity.upsert({
      where: { id: 'opp-teach-mumbai' },
      update: {},
      create: {
        id: 'opp-teach-mumbai',
        title: 'Digital Literacy for Senior Citizens',
        description: 'Help senior citizens in Mumbai learn to use smartphones, video calls, and online banking. Sessions are held at community centres every Saturday morning. No prior teaching experience required — just patience and enthusiasm!',
        skills: ['Teaching', 'Communication', 'Patience'],
        category: 'EDUCATION',
        locationId: 'loc-mumbai',
        createdById: coord1.id,
        status: 'ACTIVE',
        startDate: new Date(future(7)),
        endDate: new Date(future(90)),
        hoursPerSession: 3,
        totalSlots: 10,
        isRemote: false,
      },
    }),
    prisma.opportunity.upsert({
      where: { id: 'opp-tree-pune' },
      update: {},
      create: {
        id: 'opp-tree-pune',
        title: 'Urban Tree Plantation Drive',
        description: 'Join our city-wide tree plantation initiative in Pune. We aim to plant 500 trees across 5 neighbourhoods. Volunteers will receive gloves, tools, and saplings. Great for families and groups!',
        skills: ['Physical Fitness', 'Teamwork'],
        category: 'ENVIRONMENT',
        locationId: 'loc-pune',
        createdById: coord2.id,
        status: 'ACTIVE',
        startDate: new Date(future(3)),
        endDate: new Date(future(30)),
        hoursPerSession: 4,
        totalSlots: 25,
        isRemote: false,
      },
    }),
    prisma.opportunity.upsert({
      where: { id: 'opp-code-remote' },
      update: {},
      create: {
        id: 'opp-code-remote',
        title: 'Code Mentorship for Rural Students',
        description: 'Mentor rural high school students learning to code via online sessions. You will guide students through Python basics, help debug their projects, and inspire them to pursue technology careers.',
        skills: ['Coding', 'Teaching', 'Mentoring'],
        category: 'TECHNOLOGY',
        locationId: null,
        createdById: coord1.id,
        status: 'ACTIVE',
        startDate: new Date(future(5)),
        endDate: new Date(future(60)),
        hoursPerSession: 2,
        totalSlots: 15,
        isRemote: true,
      },
    }),
    prisma.opportunity.upsert({
      where: { id: 'opp-health-nagpur' },
      update: {},
      create: {
        id: 'opp-health-nagpur',
        title: 'Free Health Screening Camp',
        description: 'Assist medical professionals at a free health screening camp in Nagpur. Volunteers will help with registration, patient guidance, and post-screening counselling support.',
        skills: ['Healthcare', 'Communication', 'Empathy'],
        category: 'HEALTH',
        locationId: 'loc-nagpur',
        createdById: coord2.id,
        status: 'ACTIVE',
        startDate: new Date(future(10)),
        endDate: new Date(future(10)),
        hoursPerSession: 6,
        totalSlots: 8,
        isRemote: false,
      },
    }),
  ]);
  console.log(`✅ ${opps.length} opportunities`);

  // ─── Events ───────────────────────────────────────────────────
  const events = await Promise.all([
    prisma.event.upsert({
      where: { id: 'evt-teach-1' },
      update: {},
      create: {
        id: 'evt-teach-1',
        opportunityId: 'opp-teach-mumbai',
        title: 'Digital Literacy — Session 1',
        description: 'Introduction to smartphones and basic apps',
        eventDate: new Date(future(7)),
        startTime: '09:00',
        endTime: '12:00',
        venue: 'Dadar Community Centre, Mumbai',
        capacity: 10,
        isVirtual: false,
        status: 'SCHEDULED',
      },
    }),
    prisma.event.upsert({
      where: { id: 'evt-teach-2' },
      update: {},
      create: {
        id: 'evt-teach-2',
        opportunityId: 'opp-teach-mumbai',
        title: 'Digital Literacy — Session 2',
        description: 'Video calls and online banking safety',
        eventDate: new Date(future(14)),
        startTime: '09:00',
        endTime: '12:00',
        venue: 'Dadar Community Centre, Mumbai',
        capacity: 10,
        isVirtual: false,
        status: 'SCHEDULED',
      },
    }),
    prisma.event.upsert({
      where: { id: 'evt-tree-1' },
      update: {},
      create: {
        id: 'evt-tree-1',
        opportunityId: 'opp-tree-pune',
        title: 'Tree Plantation — Kothrud Zone',
        description: 'Planting 100 saplings in Kothrud neighbourhood',
        eventDate: new Date(future(3)),
        startTime: '07:00',
        endTime: '11:00',
        venue: 'Kothrud Garden, Pune',
        capacity: 25,
        isVirtual: false,
        status: 'SCHEDULED',
      },
    }),
    prisma.event.upsert({
      where: { id: 'evt-code-1' },
      update: {},
      create: {
        id: 'evt-code-1',
        opportunityId: 'opp-code-remote',
        title: 'Python Basics — Week 1',
        description: 'Variables, loops, and functions',
        eventDate: new Date(future(5)),
        startTime: '18:00',
        endTime: '20:00',
        venue: null,
        capacity: 15,
        isVirtual: true,
        meetingLink: 'https://meet.google.com/demo-link',
        status: 'SCHEDULED',
      },
    }),
    prisma.event.upsert({
      where: { id: 'evt-health-1' },
      update: {},
      create: {
        id: 'evt-health-1',
        opportunityId: 'opp-health-nagpur',
        title: 'Health Screening Camp — Day 1',
        description: 'Blood pressure, sugar, and BMI screening',
        eventDate: new Date(future(10)),
        startTime: '08:00',
        endTime: '14:00',
        venue: 'Sitabuldi Community Hall, Nagpur',
        capacity: 8,
        isVirtual: false,
        status: 'SCHEDULED',
      },
    }),
  ]);
  console.log(`✅ ${events.length} events`);

  // ─── Applications (accepted) ──────────────────────────────────
  const apps = await Promise.all([
    prisma.application.upsert({
      where: { opportunityId_volunteerId: { opportunityId: 'opp-teach-mumbai', volunteerId: volunteers[0].id } },
      update: {},
      create: { opportunityId: 'opp-teach-mumbai', volunteerId: volunteers[0].id, status: 'ACCEPTED' },
    }),
    prisma.application.upsert({
      where: { opportunityId_volunteerId: { opportunityId: 'opp-teach-mumbai', volunteerId: volunteers[2].id } },
      update: {},
      create: { opportunityId: 'opp-teach-mumbai', volunteerId: volunteers[2].id, status: 'ACCEPTED' },
    }),
    prisma.application.upsert({
      where: { opportunityId_volunteerId: { opportunityId: 'opp-tree-pune', volunteerId: volunteers[1].id } },
      update: {},
      create: { opportunityId: 'opp-tree-pune', volunteerId: volunteers[1].id, status: 'ACCEPTED' },
    }),
    prisma.application.upsert({
      where: { opportunityId_volunteerId: { opportunityId: 'opp-code-remote', volunteerId: volunteers[2].id } },
      update: {},
      create: { opportunityId: 'opp-code-remote', volunteerId: volunteers[2].id, status: 'ACCEPTED' },
    }),
    prisma.application.upsert({
      where: { opportunityId_volunteerId: { opportunityId: 'opp-health-nagpur', volunteerId: volunteers[3].id } },
      update: {},
      create: { opportunityId: 'opp-health-nagpur', volunteerId: volunteers[3].id, status: 'ACCEPTED' },
    }),
    // Pending application
    prisma.application.upsert({
      where: { opportunityId_volunteerId: { opportunityId: 'opp-code-remote', volunteerId: volunteers[0].id } },
      update: {},
      create: { opportunityId: 'opp-code-remote', volunteerId: volunteers[0].id, status: 'PENDING' },
    }),
  ]);
  console.log(`✅ ${apps.length} applications`);

  console.log('\n🎉 Demo seed complete!\n');
  console.log('Demo accounts (use OTP login — any 6-digit code works in dev):');
  console.log('  Admin:       admin@wetheyuva.org');
  console.log('  Coordinator: coord1@wetheyuva.org  (Mumbai)');
  console.log('  Coordinator: coord2@wetheyuva.org  (Pune)');
  console.log('  Observer:    observer@wetheyuva.org');
  console.log('  Volunteer:   vol1@wetheyuva.org    (Arjun Mehta)');
  console.log('  Volunteer:   vol2@wetheyuva.org    (Kavya Nair)');
  console.log('  Volunteer:   vol3@wetheyuva.org    (Rohan Kulkarni)');
  console.log('  Volunteer:   vol4@wetheyuva.org    (Meera Iyer)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
