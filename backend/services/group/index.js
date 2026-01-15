// backend/services/group/index.js
import groupInvite from "./group.invite.js";
import groupJoin from "./group.join.js";
import groupManagement from "./group.management.js";
import groupPermissions from "./group.permissions.js";

export default {
  invite: groupInvite,
  join: groupJoin,
  management: groupManagement,
  permissions: groupPermissions,
};