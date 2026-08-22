export function applyChallengeProgress(enrollment, increment, targetCount) {
  const current = Number(enrollment?.progress) || 0;
  const step = Number(increment);
  const amount = Number.isFinite(step) && step > 0 ? step : 1;
  const target = Number(targetCount) || 0;

  if (enrollment?.completed) {
    return { progress: current, completed: true, newlyCompleted: false };
  }

  const progress = target > 0 ? Math.min(target, current + amount) : current + amount;
  const completed = target > 0 && progress >= target;
  return { progress, completed, newlyCompleted: completed };
}

export function challengeCardStatus({ completed, joined, progress, targetCount }) {
  if (completed || (targetCount > 0 && progress >= targetCount)) return 'completed';
  if (joined) return 'active';
  return 'available';
}
