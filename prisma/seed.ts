import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping seed in production');
    return;
  }
  console.log('🌱 Seeding demo data...\n');

  // ─── Default Roles with Permissions ───────────────────────────
  const defaultRoles = [
    {
      name: 'VOLUNTEER',
      description: 'Participates in volunteering activities',
      permissions: [
        'opportunity:view',
        'opportunity:apply',
        'event:checkin',
        'stats:view:own',
        'story:create',
        'story:edit',
        'feedback:submit',
        'training:complete',
        'alert:manage',
        'user:events:view',
        'user:profile:manage',
        'level:view',
        'level:request',
        'certificate:view',
        'certificate:download',
        'mentorship:create',
        'mentorship:manage',
        'file:upload',
      ],
    },
    {
      name: 'COORDINATOR',
      description: 'Manages opportunities, events, and volunteers for an organization',
      permissions: [
        'opportunity:create',
        'opportunity:edit',
        'opportunity:manage',
        'event:create',
        'event:edit',
        'event:manage',
        'event:checkin',
        'stats:view:own',
        'story:create',
        'story:edit',
        'feedback:manage',
        'alert:manage',
        'user:profile:manage',
        'user:volunteers:manage',
        'user:profile:view',
        'level:view',
        'level:review',
        'certificate:view',
        'certificate:download',
        'mentorship:create',
        'mentorship:manage',
        'file:upload',
      ],
    },
    {
      name: 'ORGANIZATION_ADMIN',
      description: 'Manages organization, coordinators, and all org-level operations',
      permissions: [
        'org:create',
        'coordinator:manage',
        'org:manage',
        'org:verify',
        'opportunity:create',
        'opportunity:edit',
        'opportunity:manage',
        'event:create',
        'event:edit',
        'event:manage',
        'event:checkin',
        'stats:view:own',
        'story:create',
        'story:edit',
        'feedback:manage',
        'alert:manage',
        'user:profile:manage',
        'user:profile:view',
        'user:volunteers:manage',
        'level:view',
        'level:review',
        'certificate:view',
        'certificate:download',
        'mentorship:create',
        'mentorship:manage',
        'file:upload',
      ],
    },
    {
      name: 'PLATFORM_MANAGER',
      description:
        'Global operations manager — handles organization verification and community moderation',
      permissions: [
        'org:manage',
        'org:verify',
        'user:manage',
        'user:profile:view',
        'user:volunteers:manage',
        'opportunity:view',
        'opportunity:manage',
        'event:manage',
        'stats:view:observer',
        'story:moderate',
        'story:view:all',
        'feedback:manage',
        'certificate:view',
        'certificate:download',
        'mentorship:create',
        'mentorship:manage',
        'file:upload',
      ],
    },
    {
      name: 'ADMIN',
      description: 'Full platform control — manages users, roles, organizations, and system config',
      permissions: [
        'user:manage',
        'system:config',
        'org:create',
        'org:manage',
        'org:verify',
        'coordinator:manage',
        'opportunity:create',
        'opportunity:edit',
        'opportunity:manage',
        'opportunity:view',
        'event:create',
        'event:edit',
        'event:manage',
        'event:checkin',
        'stats:view:own',
        'stats:view:observer',
        'story:create',
        'story:edit',
        'story:moderate',
        'story:view:all',
        'training:create',
        'training:edit',
        'training:complete',
        'feedback:submit',
        'feedback:manage',
        'alert:manage',
        'user:profile:manage',
        'user:profile:view',
        'user:volunteers:manage',
        'level:view',
        'level:review',
        'certificate:view',
        'certificate:download',
        'mentorship:create',
        'mentorship:manage',
        'file:upload',
      ],
    },
    {
      name: 'OBSERVER',
      description: 'Read-only access for donors, partners, and leadership',
      permissions: ['opportunity:view', 'stats:view:observer', 'user:profile:manage'],
    },
  ];

  const createdRoles = await Promise.all(
    defaultRoles.map((r) =>
      prisma.role.upsert({
        where: { name: r.name },
        update: { description: r.description, permissions: r.permissions },
        create: { name: r.name, description: r.description, permissions: r.permissions },
      })
    )
  );
  console.log(`✅ ${createdRoles.length} roles`);

  const roleByName = Object.fromEntries(createdRoles.map((r) => [r.name, r.id]));

  // ─── Locations ────────────────────────────────────────────────
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: 'loc-mumbai' },
      update: {},
      create: {
        id: 'loc-mumbai',
        name: 'Mumbai',
        district: 'Mumbai City',
        state: 'Maharashtra',
        lat: 19.076,
        lng: 72.877,
      },
    }),
    prisma.location.upsert({
      where: { id: 'loc-pune' },
      update: {},
      create: {
        id: 'loc-pune',
        name: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        lat: 18.52,
        lng: 73.856,
      },
    }),
    prisma.location.upsert({
      where: { id: 'loc-nagpur' },
      update: {},
      create: {
        id: 'loc-nagpur',
        name: 'Nagpur',
        district: 'Nagpur',
        state: 'Maharashtra',
        lat: 21.145,
        lng: 79.088,
      },
    }),
  ]);
  console.log(`✅ ${locations.length} locations`);

  // ─── Users ────────────────────────────────────────────────────
  const _admin = await prisma.user.upsert({
    where: { email: 'admin@wetheyuva.org' },
    update: {},
    create: {
      email: 'admin@wetheyuva.org',
      name: 'Priya Sharma',
      roleId: roleByName.ADMIN,
      status: 'ACTIVE',
      locationId: 'loc-mumbai',
      consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
    },
  });

  const coord1 = await prisma.user.upsert({
    where: { email: 'coord1@wetheyuva.org' },
    update: {},
    create: {
      email: 'coord1@wetheyuva.org',
      name: 'Rahul Desai',
      roleId: roleByName.COORDINATOR,
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
      roleId: roleByName.COORDINATOR,
      status: 'ACTIVE',
      locationId: 'loc-pune',
      consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
    },
  });

  const _observer = await prisma.user.upsert({
    where: { email: 'observer@wetheyuva.org' },
    update: {},
    create: {
      email: 'observer@wetheyuva.org',
      name: 'Amit Joshi',
      roleId: roleByName.OBSERVER,
      status: 'ACTIVE',
      locationId: 'loc-nagpur',
      consent: { create: { privacyPolicyAccepted: true, mediaConsentAccepted: true } },
    },
  });

  const volunteers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'vol1@wetheyuva.org' },
      update: {},
      create: {
        email: 'vol1@wetheyuva.org',
        name: 'Arjun Mehta',
        roleId: roleByName.VOLUNTEER,
        volunteerType: 'STUDENT',
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
        roleId: roleByName.VOLUNTEER,
        volunteerType: 'PROFESSIONAL',
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
        roleId: roleByName.VOLUNTEER,
        volunteerType: 'PROFESSIONAL',
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
        roleId: roleByName.VOLUNTEER,
        volunteerType: 'EVENT',
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
  console.log(
    `✅ ${2 + 2 + volunteers.length} users (1 admin, 2 coordinators, 1 observer, ${volunteers.length} volunteers)`
  );

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
        description:
          'Help senior citizens in Mumbai learn to use smartphones, video calls, and online banking. Sessions are held at community centres every Saturday morning. No prior teaching experience required — just patience and enthusiasm!',
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
        description:
          'Join our city-wide tree plantation initiative in Pune. We aim to plant 500 trees across 5 neighbourhoods. Volunteers will receive gloves, tools, and saplings. Great for families and groups!',
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
        description:
          'Mentor rural high school students learning to code via online sessions. You will guide students through Python basics, help debug their projects, and inspire them to pursue technology careers.',
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
        description:
          'Assist medical professionals at a free health screening camp in Nagpur. Volunteers will help with registration, patient guidance, and post-screening counselling support.',
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
      where: {
        opportunityId_volunteerId: {
          opportunityId: 'opp-teach-mumbai',
          volunteerId: volunteers[0].id,
        },
      },
      update: {},
      create: {
        opportunityId: 'opp-teach-mumbai',
        volunteerId: volunteers[0].id,
        status: 'ACCEPTED',
      },
    }),
    prisma.application.upsert({
      where: {
        opportunityId_volunteerId: {
          opportunityId: 'opp-teach-mumbai',
          volunteerId: volunteers[2].id,
        },
      },
      update: {},
      create: {
        opportunityId: 'opp-teach-mumbai',
        volunteerId: volunteers[2].id,
        status: 'ACCEPTED',
      },
    }),
    prisma.application.upsert({
      where: {
        opportunityId_volunteerId: {
          opportunityId: 'opp-tree-pune',
          volunteerId: volunteers[1].id,
        },
      },
      update: {},
      create: { opportunityId: 'opp-tree-pune', volunteerId: volunteers[1].id, status: 'ACCEPTED' },
    }),
    prisma.application.upsert({
      where: {
        opportunityId_volunteerId: {
          opportunityId: 'opp-code-remote',
          volunteerId: volunteers[2].id,
        },
      },
      update: {},
      create: {
        opportunityId: 'opp-code-remote',
        volunteerId: volunteers[2].id,
        status: 'ACCEPTED',
      },
    }),
    prisma.application.upsert({
      where: {
        opportunityId_volunteerId: {
          opportunityId: 'opp-health-nagpur',
          volunteerId: volunteers[3].id,
        },
      },
      update: {},
      create: {
        opportunityId: 'opp-health-nagpur',
        volunteerId: volunteers[3].id,
        status: 'ACCEPTED',
      },
    }),
    // Pending application
    prisma.application.upsert({
      where: {
        opportunityId_volunteerId: {
          opportunityId: 'opp-code-remote',
          volunteerId: volunteers[0].id,
        },
      },
      update: {},
      create: {
        opportunityId: 'opp-code-remote',
        volunteerId: volunteers[0].id,
        status: 'PENDING',
      },
    }),
  ]);
  console.log(`✅ ${apps.length} applications`);

  // ─── Levels / Tiers ─────────────────────────────────────────────
  const level0 = await prisma.level.upsert({
    where: { tier: 0 },
    update: {},
    create: {
      name: 'ONBOARDED',
      tier: 0,
      description: 'Initial entry into the civic pipeline. Complete orientation to get started.',
      requirements: { minEvents: 1 },
      badgeIcon: 'Sprout',
      color: 'slate',
      gradient: 'from-slate-500 to-slate-400',
      badgeShape: 'circle',
    },
  });
  const level1 = await prisma.level.upsert({
    where: { tier: 1 },
    update: {},
    create: {
      name: 'MOBILIZER',
      tier: 1,
      description: 'Builds local engagement and community participation by referring fellow citizens.',
      requirements: { minReferrals: 5 },
      badgeIcon: 'Users',
      color: 'amber',
      gradient: 'from-amber-600 to-amber-400',
      badgeShape: 'hexagon',
    },
  });
  const level2 = await prisma.level.upsert({
    where: { tier: 2 },
    update: {},
    create: {
      name: 'PROBLEM_SOLVER',
      tier: 2,
      description: 'Uses formal governance channels to report and resolve localized issues.',
      requirements: { minGrievances: 1, requiresFollowUp: true },
      badgeIcon: 'Wrench',
      color: 'blue',
      gradient: 'from-blue-600 to-cyan-400',
      badgeShape: 'shield',
    },
  });
  const level3 = await prisma.level.upsert({
    where: { tier: 3 },
    update: {},
    create: {
      name: 'LEADERSHIP',
      tier: 3,
      description: 'Leads sustainable community solutions and develops other leaders.',
      requirements: { minIssuesResolved: 1, minMentored: 3 },
      badgeIcon: 'Crown',
      color: 'purple',
      gradient: 'from-purple-600 to-pink-400',
      badgeShape: 'star',
    },
  });
  const levels = [level0, level1, level2, level3];
  console.log(`✅ ${levels.length} levels`);

  // Assign volunteers to starting level
  await Promise.all([
    prisma.user.update({ where: { email: 'vol1@wetheyuva.org' }, data: { currentLevelId: level1.id, points: 120 } }),
    prisma.user.update({ where: { email: 'vol2@wetheyuva.org' }, data: { currentLevelId: level0.id, points: 50 } }),
    prisma.user.update({ where: { email: 'vol3@wetheyuva.org' }, data: { currentLevelId: level2.id, points: 250 } }),
    prisma.user.update({ where: { email: 'vol4@wetheyuva.org' }, data: { currentLevelId: level0.id, points: 30 } }),
  ]);

  // ─── Badges ─────────────────────────────────────────────────────
  const badgeDefinitions = [
    { name: 'FIRST_STEPS', title: 'First Steps', description: 'Complete registration, profile, and orientation.', imageUrl: '/badges/first-steps.png', criteria: { type: 'ONBOARDING_COMPLETE' } },
    { name: 'EVENT_SEEKER', title: 'Event Seeker', description: 'Attend 5 events.', imageUrl: '/badges/event-seeker.png', criteria: { type: 'EVENTS_ATTENDED', count: 5 } },
    { name: 'CENTURY_CLUB', title: 'Century Club', description: 'Log 100 volunteer hours.', imageUrl: '/badges/century-club.png', criteria: { type: 'HOURS_LOGGED', count: 100 } },
    { name: 'COMMUNITY_BUILDER', title: 'Community Builder', description: 'Refer 10 citizens.', imageUrl: '/badges/community-builder.png', criteria: { type: 'REFERRALS', count: 10 } },
    { name: 'PROBLEM_SOLVER', title: 'Problem Solver', description: 'Resolve 5 civic grievances.', imageUrl: '/badges/problem-solver.png', criteria: { type: 'GRIEVANCES_RESOLVED', count: 5 } },
    { name: 'MENTOR', title: 'Mentor', description: 'Mentor 5 volunteers.', imageUrl: '/badges/mentor.png', criteria: { type: 'MENTEES', count: 5 } },
    { name: 'FAST_RISER', title: 'Fast Riser', description: 'Reach Level 2 within 30 days of joining.', imageUrl: '/badges/fast-riser.png', criteria: { type: 'LEVEL_2_IN_30_DAYS' } },
    { name: 'STREAK_MASTER', title: 'Streak Master', description: 'Maintain a 30-day streak.', imageUrl: '/badges/streak-master.png', criteria: { type: 'STREAK', count: 30 } },
    { name: 'STORYTELLER', title: 'Storyteller', description: 'Publish 5 stories.', imageUrl: '/badges/storyteller.png', criteria: { type: 'STORIES_PUBLISHED', count: 5 } },
    { name: 'NIGHT_OWL', title: 'Night Owl', description: 'Attend 3 evening/weekend events.', imageUrl: '/badges/night-owl.png', criteria: { type: 'EVENTS_AFTER_HOURS', count: 3 } },
  ];
  const createdBadges = await Promise.all(
    badgeDefinitions.map((b) =>
      prisma.badge.upsert({
        where: { name: b.name },
        update: {},
        create: b,
      })
    )
  );
  console.log(`✅ ${createdBadges.length} badges`);

  console.log('\n🎉 Demo seed complete!\n');
  console.log('Demo accounts (use OTP login — any 6-digit code works in dev):');
  console.log('  Admin:       admin@wetheyuva.org');
  console.log('  Coordinator: coord1@wetheyuva.org  (Mumbai)');
  console.log('  Coordinator: coord2@wetheyuva.org  (Pune)');
  console.log('  Observer:    observer@wetheyuva.org');
  console.log('  Volunteer:   vol1@wetheyuva.org    (Arjun Mehta — STUDENT)');
  console.log('  Volunteer:   vol2@wetheyuva.org    (Kavya Nair — PROFESSIONAL)');
  console.log('  Volunteer:   vol3@wetheyuva.org    (Rohan Kulkarni — PROFESSIONAL)');
  console.log('  Volunteer:   vol4@wetheyuva.org    (Meera Iyer — EVENT)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
