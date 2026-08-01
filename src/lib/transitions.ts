/** Pure status-machine helper used across appointments / billing / Rx. */
export function canTransition<T extends string>(
  transitions: Record<T, readonly T[]>,
  from: T,
  to: T,
): boolean {
  return transitions[from]?.includes(to) ?? false;
}
