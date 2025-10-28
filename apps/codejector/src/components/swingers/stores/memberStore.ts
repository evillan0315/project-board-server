import { map } from 'nanostores';
import { IMemberFull } from '@/components/swingers/types';

/**
 * @interface MemberStoreState
 * @description Represents the state of the member Nanostore.
 * @property {Record<string, IMemberFull>} members - A map where keys are `member.userId` (as string) and values are `IMemberFull` objects.
 */
interface MemberStoreState {
  members: Record<string, IMemberFull>;
}

/**
 * @const memberStore
 * @description Nanostore for managing unique IMemberFull objects by their userId.
 */
export const memberStore = map<MemberStoreState>({
  members: {},
});

/**
 * @function addMember
 * @description Adds or updates a single IMemberFull object in the store.
 * @param {IMemberFull} member - The member object to add or update.
 */
export const addMember = (member: IMemberFull) => {
  if (member?.userId) {
    memberStore.setKey('members', { ...memberStore.get().members, [member.userId.toString()]: member });
  } else {
    console.warn('Attempted to add member without a userId:', member);
  }
};

/**
 * @function addMembers
 * @description Adds or updates multiple IMemberFull objects in the store.
 * @param {IMemberFull[]} membersToAdd - An array of member objects to add or update.
 */
export const addMembers = (membersToAdd: IMemberFull[]) => {
  const currentMembers = memberStore.get().members;
  const newMembers: Record<string, IMemberFull> = { ...currentMembers };
  membersToAdd.forEach((member) => {
    if (member?.userId) {
      newMembers[member.userId.toString()] = member;
    }
  });
  memberStore.setKey('members', newMembers);
};

/**
 * @function getMember
 * @description Retrieves a member by their userId.
 * @param {number} userId - The userId of the member to retrieve.
 * @returns {IMemberFull | undefined} The member object if found, otherwise undefined.
 */
export const getMember = (userId: number): IMemberFull | undefined => {
  return memberStore.get().members[userId.toString()];
};

/**
 * @function clearMembers
 * @description Clears all members from the store.
 */
export const clearMembers = () => {
  memberStore.setKey('members', {});
};
