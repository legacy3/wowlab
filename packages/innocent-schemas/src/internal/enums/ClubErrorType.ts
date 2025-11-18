import * as Schema from "effect/Schema";

/**
 * Auto-generated from World of Warcraft 11.2.5.63906
 * Source: https://github.com/Gethe/wow-ui-source/tree/7dd1c12d542cf2e0c46ce9282886287f3fd0a2c7
 */

/* eslint-disable perfectionist/sort-enums */
export enum ClubErrorType {
  ErrorCommunitiesNone = 0,
  ErrorCommunitiesUnknown = 1,
  ErrorCommunitiesNeutralFaction = 2,
  ErrorCommunitiesUnknownRealm = 3,
  ErrorCommunitiesBadTarget = 4,
  ErrorCommunitiesWrongFaction = 5,
  ErrorCommunitiesRestricted = 6,
  ErrorCommunitiesIgnored = 7,
  ErrorCommunitiesGuild = 8,
  ErrorCommunitiesWrongRegion = 9,
  ErrorCommunitiesUnknownTicket = 10,
  ErrorCommunitiesMissingShortName = 11,
  ErrorCommunitiesProfanity = 12,
  ErrorCommunitiesTrial = 13,
  ErrorCommunitiesVeteranTrial = 14,
  ErrorCommunitiesChatMute = 15,
  ErrorClubFull = 16,
  ErrorClubNoClub = 17,
  ErrorClubNotMember = 18,
  ErrorClubAlreadyMember = 19,
  ErrorClubNoSuchMember = 20,
  ErrorClubNoSuchInvitation = 21,
  ErrorClubInvitationAlreadyExists = 22,
  ErrorClubInvalidRoleID = 23,
  ErrorClubInsufficientPrivileges = 24,
  ErrorClubTooManyClubsJoined = 25,
  ErrorClubVoiceFull = 26,
  ErrorClubStreamNoStream = 27,
  ErrorClubStreamInvalidName = 28,
  ErrorClubStreamCountAtMin = 29,
  ErrorClubStreamCountAtMax = 30,
  ErrorClubMemberHasRequiredRole = 31,
  ErrorClubSentInvitationCountAtMax = 32,
  ErrorClubReceivedInvitationCountAtMax = 33,
  ErrorClubTargetIsBanned = 34,
  ErrorClubBanAlreadyExists = 35,
  ErrorClubBanCountAtMax = 36,
  ErrorClubTicketCountAtMax = 37,
  ErrorClubTicketNoSuchTicket = 38,
  ErrorClubTicketHasConsumedAllowedRedeemCount = 39,
  ErrorClubDoesntAllowCrossFaction = 40,
  ErrorClubEditHasCrossFactionMembers = 41,
}

export const ClubErrorTypeSchema = Schema.Enums(ClubErrorType);
