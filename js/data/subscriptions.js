export const SUBSCRIPTION_PLANS = [
  {
    id: 'player',
    name: 'Player Membership',
    price: 29.99,
    period: 'month',
    description: 'Everything you need to train smarter every day.',
    featured: false,
    features: [
      'Daily guided training sessions',
      'Position-specific development plans',
      'Dribbling programs',
      'First touch training',
      'Passing and receiving',
      'Finishing techniques',
      'Ball mastery',
      'Weak foot development',
      'Speed, agility, and conditioning',
      'Mobility and recovery',
      'Progress tracking',
      'Monthly skill challenges',
      'Achievement badges',
      'Complete training drill library',
    ],
  },
  {
    id: 'elite',
    name: 'Elite Membership',
    price: 59.99,
    period: 'month',
    description: 'Personalized training for serious players.',
    featured: true,
    features: [
      'Everything in Player Membership',
      'Personalized training plans from your profile',
      'Video skill assessments',
      'Personalized feedback',
      'Monthly player evaluations',
      'Advanced position-specific training',
      'Strength and conditioning programs',
    ],
  },
  {
    id: 'team',
    name: 'Team Membership',
    price: 199,
    period: 'month',
    description: 'Built for clubs and coaches.',
    featured: false,
    features: [
      'Unlimited players',
      'Coach dashboard',
      'Assign training sessions',
      'Track completion',
      'Team leaderboards',
      'Player progress reports',
    ],
  },
];

export const USER_ROLES = {
  PLAYER: 'player',
  COACH: 'coach',
  PARENT: 'parent',
  ADMIN: 'admin',
};

export function planOptionLabel(plan) {
  const price = Number.isInteger(plan.price) ? `$${plan.price}` : `$${plan.price.toFixed(2)}`;
  const short = String(plan.name || '').replace(/ Membership$/, '');
  return `${short} — ${price}/mo`;
}

export function plansForRole(role) {
  if (role === 'coach') return SUBSCRIPTION_PLANS.filter((p) => p.id === 'team');
  return SUBSCRIPTION_PLANS.filter((p) => p.id !== 'team');
}

export function defaultPlanForRole(role) {
  return role === 'coach' ? 'team' : 'player';
}

export function roleForPlan(planId) {
  return planId === 'team' ? 'coach' : null;
}

export function selectedPlanForRole(role, preferredPlan) {
  const options = plansForRole(role);
  if (preferredPlan && options.some((p) => p.id === preferredPlan)) return preferredPlan;
  return defaultPlanForRole(role);
}
