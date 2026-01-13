/**
 * Status priority order for sorting tasks
 * Lower number = higher priority (appears first)
 */
const STATUS_SORT_ORDER: Record<string, number> = {
  in_progress: 1,
  in_review: 2,
  waiting: 3,
  pending: 4,
  approved: 5,
  completed: 6,
  cancelled: 7,
};

/**
 * Get the sort priority for a given status
 * @param status - Task status
 * @returns Sort priority number (lower = higher priority)
 */
export function getStatusSortPriority(status: string): number {
  return STATUS_SORT_ORDER[status] ?? 999;
}

/**
 * Compare function for sorting tasks by status
 * @param statusA - First task status
 * @param statusB - Second task status
 * @returns Comparison result for Array.sort()
 */
export function compareTasksByStatus(statusA: string, statusB: string): number {
  return getStatusSortPriority(statusA) - getStatusSortPriority(statusB);
}
