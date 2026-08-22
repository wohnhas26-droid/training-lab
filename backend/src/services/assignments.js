export function playerCanSeeAssignment(assignTo, playerId) {
  return assignTo === 'all' || String(assignTo) === String(playerId);
}

export function assigneeCount(assignTo, rosterSize) {
  const size = Number(rosterSize) || 0;
  return assignTo === 'all' ? size : 1;
}

export function serializeAssignment(assignment, { rosterSize = 0, completions = [], playerId = null } = {}) {
  const list = Array.isArray(completions) ? completions : [];
  const completedCount = list.length;
  const assignees = assigneeCount(assignment.assignTo, rosterSize);
  const doneForPlayer = list.some((c) => String(c.playerId) === String(playerId));
  const completed = playerId
    ? doneForPlayer
    : completedCount >= assignees && assignees > 0;
  const today = new Date().toISOString().split('T')[0];
  const overdue = Boolean(assignment.dueDate && assignment.dueDate < today && !completed);

  return {
    id: assignment.id,
    title: assignment.title,
    category: assignment.category,
    dueDate: assignment.dueDate,
    notes: assignment.notes || '',
    assignTo: assignment.assignTo,
    createdAt: assignment.createdAt,
    assigneeCount: assignees,
    completedCount,
    completed,
    overdue,
    completions: list.map((c) => ({
      playerId: c.playerId,
      name: c.player?.name || c.name || null,
      completedAt: c.completedAt,
    })),
  };
}

export async function loadAssignmentViews(prisma, assignments, { playerId = null } = {}) {
  if (!assignments.length) return [];

  const teamIds = [...new Set(assignments.map((a) => a.teamId).filter(Boolean))];
  const rosterRows = teamIds.length
    ? await prisma.teamMember.groupBy({
      by: ['teamId'],
      where: { teamId: { in: teamIds } },
      _count: { userId: true },
    })
    : [];
  const rosterCounts = Object.fromEntries(rosterRows.map((r) => [r.teamId, r._count.userId]));

  const completions = await prisma.assignmentCompletion.findMany({
    where: { assignmentId: { in: assignments.map((a) => a.id) } },
    include: { player: { select: { id: true, name: true } } },
  });
  const byAssignment = new Map();
  for (const row of completions) {
    if (!byAssignment.has(row.assignmentId)) byAssignment.set(row.assignmentId, []);
    byAssignment.get(row.assignmentId).push(row);
  }

  return assignments.map((assignment) => serializeAssignment(assignment, {
    rosterSize: rosterCounts[assignment.teamId] || 0,
    completions: byAssignment.get(assignment.id) || [],
    playerId,
  }));
}
