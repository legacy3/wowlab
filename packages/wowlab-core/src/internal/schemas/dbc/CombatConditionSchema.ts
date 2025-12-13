import * as Schema from "effect/Schema";

export const CombatConditionRowSchema = Schema.Struct({
  ID: Schema.NumberFromString,
  WorldStateExpressionID: Schema.NumberFromString,
  SelfConditionID: Schema.NumberFromString,
  TargetConditionID: Schema.NumberFromString,
  FriendConditionLogic: Schema.NumberFromString,
  EnemyConditionLogic: Schema.NumberFromString,
  FriendConditionID_0: Schema.NumberFromString,
  FriendConditionID_1: Schema.NumberFromString,
  FriendConditionOp_0: Schema.NumberFromString,
  FriendConditionOp_1: Schema.NumberFromString,
  FriendConditionCount_0: Schema.NumberFromString,
  FriendConditionCount_1: Schema.NumberFromString,
  EnemyConditionID_0: Schema.NumberFromString,
  EnemyConditionID_1: Schema.NumberFromString,
  EnemyConditionOp_0: Schema.NumberFromString,
  EnemyConditionOp_1: Schema.NumberFromString,
  EnemyConditionCount_0: Schema.NumberFromString,
  EnemyConditionCount_1: Schema.NumberFromString,
});

export type CombatConditionRow = Schema.Schema.Type<
  typeof CombatConditionRowSchema
>;
