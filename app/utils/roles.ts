export type UserRole = 'founder' | 'investor' | 'freelancer' | 'hirer' | 'admin';

export const ROLES: { value: UserRole; label: string; icon: string; description: string }[] = [
  { 
    value: 'founder', 
    label: 'Founder', 
    icon: '🚀',
    description: 'I\'m building or want to build a startup'
  },
  { 
    value: 'investor', 
    label: 'Investor', 
    icon: '💰',
    description: 'I invest in or want to invest in startups'
  },
  { 
    value: 'freelancer', 
    label: 'Freelancer', 
    icon: '💼',
    description: 'I offer services and skills for hire'
  },
  { 
    value: 'hirer', 
    label: 'Hirer', 
    icon: '🎯',
    description: 'I need to hire talent for my projects'
  },
  { 
    value: 'admin', 
    label: 'Admin', 
    icon: '🛡️',
    description: 'Platform administrator'
  }
];

export const getRoleInfo = (role: UserRole) => {
  return ROLES.find(r => r.value === role) || ROLES[0];
};

export const formatRole = (role: string) => {
  return role.charAt(0).toUpperCase() + role.slice(1);
};

export const isAdminRole = (role: UserRole) => {
  return role === 'admin';
};

export const canAccessAdmin = (email: string, role: UserRole) => {
  const ADMIN_EMAILS = [
    'saimahendra222@gmail.com',
    'mahendra10kcoders@gmail.com',
  ];
  return ADMIN_EMAILS.includes(email.toLowerCase()) && role === 'admin';
};
