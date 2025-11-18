import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ClubActionType {
  ErrorClubActionSubscribe = 0,
  ErrorClubActionCreate = 1,
  ErrorClubActionEdit = 2,
  ErrorClubActionDestroy = 3,
  ErrorClubActionLeave = 4,
  ErrorClubActionCreateTicket = 5,
  ErrorClubActionDestroyTicket = 6,
  ErrorClubActionRedeemTicket = 7,
  ErrorClubActionGetTicket = 8,
  ErrorClubActionGetTickets = 9,
  ErrorClubActionGetBans = 10,
  ErrorClubActionGetInvitations = 11,
  ErrorClubActionRevokeInvitation = 12,
  ErrorClubActionAcceptInvitation = 13,
  ErrorClubActionDeclineInvitation = 14,
  ErrorClubActionCreateStream = 15,
  ErrorClubActionEditStream = 16,
  ErrorClubActionDestroyStream = 17,
  ErrorClubActionInviteMember = 18,
  ErrorClubActionEditMember = 19,
  ErrorClubActionEditMemberNote = 20,
  ErrorClubActionKickMember = 21,
  ErrorClubActionAddBan = 22,
  ErrorClubActionRemoveBan = 23,
  ErrorClubActionCreateMessage = 24,
  ErrorClubActionEditMessage = 25,
  ErrorClubActionDestroyMessage = 26,
}

export const ClubActionTypeSchema = Schema.Enums(ClubActionType);
