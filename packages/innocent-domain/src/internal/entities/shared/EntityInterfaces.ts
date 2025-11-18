export interface ComputedEntity<T, TSourceProps> {
  with(updates: Partial<TSourceProps>, currentTime: number): T;
}
