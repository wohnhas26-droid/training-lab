export function serializeCoachFeedback(entry) {
  return {
    feedback: entry.feedback,
    rating: entry.rating,
    date: entry.date,
    coachName: entry.coach?.name || null,
  };
}
