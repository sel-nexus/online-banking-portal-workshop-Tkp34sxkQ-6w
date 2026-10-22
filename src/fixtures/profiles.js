const MIGUEL_ROSA_PROFILE = Object.freeze({
  id: 'profile-miguel-rosa',
  userId: 'user-miguel-rosa',
  firstName: 'Miguel',
  lastName: 'Rosa',
  fullName: 'Miguel Rosa',
  email: 'miguel.rosa@example.test',
  phone: '+63 917 555 0142',
  mobileNumber: '+63 917 555 0142',
  address: 'Makati City, Metro Manila',
  dateOfBirth: '1988-04-12',
  avatarUrl: '',
  role: 'Primary workshop customer. Everyday banking, and he also holds the home loan shown on the reference screen',
  status: 'active',
  preferredLanguage: 'English',
  displayId: 'miguel (•••• 4821)',
  maskedDisplayId: 'miguel •••• 4821',
  greeting: 'Magandang umaga, Miguel',
  englishGreeting: 'Good morning, Miguel',
  filipinoGreeting: 'Magandang umaga, Miguel',
  lastLogin: '2026-10-14T08:10:00+08:00',
  lastLoginAt: '2026-10-14T08:10:00+08:00',
  lastLoginDisplay: '14 Oct, 8:10 AM',
  relationshipTotal: 142860.25,
  demoCredentialMetadata: Object.freeze({
    isDemo: true,
    username: 'miguel',
    legacyUsername: 'miguel.rosa.demo',
    passwordDisplay: 'demo-only',
    passwordHint: 'Use demo-only for this workshop environment.',
    sensitiveDataNotice: 'Never use a real password in the demonstration portal.',
  }),
  credentials: Object.freeze({
    isDemo: true,
    username: 'miguel',
    legacyUsername: 'miguel.rosa.demo',
    passwordDisplay: 'demo-only',
    passwordHint: 'Use demo-only for this workshop environment.',
  }),
  notificationPreferences: Object.freeze({
    email: true,
    sms: true,
    push: false,
  }),
});

const ROSA_PROFILE = Object.freeze({
  id: 'profile-rosa-santos',
  userId: 'user-rosa-santos',
  firstName: 'Rosa',
  lastName: 'Santos',
  fullName: 'Rosa Santos',
  email: 'rosa.santos@example.test',
  phone: '+63 918 555 0276',
  mobileNumber: '+63 918 555 0276',
  address: 'Quezon City, Metro Manila',
  dateOfBirth: '1991-09-28',
  avatarUrl: '',
  role: 'Second customer, used when the facilitator switches profile',
  status: 'active',
  preferredLanguage: 'English',
  displayId: 'rosa (•••• 2204)',
  maskedDisplayId: 'rosa •••• 2204',
  greeting: 'Magandang umaga, Rosa',
  englishGreeting: 'Good morning, Rosa',
  filipinoGreeting: 'Magandang umaga, Rosa',
  lastLogin: '2026-10-02T09:00:00+08:00',
  lastLoginAt: '2026-10-02T09:00:00+08:00',
  lastLoginDisplay: '02 Oct, 9:00 AM',
  relationshipTotal: 54300.0,
  demoCredentialMetadata: Object.freeze({
    isDemo: true,
    username: 'rosa',
    legacyUsername: 'rosa.santos.demo',
    passwordDisplay: 'demo-only',
    passwordHint: 'Use demo-only for this workshop environment.',
    sensitiveDataNotice: 'Never use a real password in the demonstration portal.',
  }),
  credentials: Object.freeze({
    isDemo: true,
    username: 'rosa',
    legacyUsername: 'rosa.santos.demo',
    passwordDisplay: 'demo-only',
    passwordHint: 'Use demo-only for this workshop environment.',
  }),
  notificationPreferences: Object.freeze({
    email: true,
    sms: false,
    push: true,
  }),
});

export const PROFILES = Object.freeze([
  MIGUEL_ROSA_PROFILE,
  ROSA_PROFILE,
]);

export const profiles = PROFILES;

export { MIGUEL_ROSA_PROFILE, ROSA_PROFILE };

export default PROFILES;
