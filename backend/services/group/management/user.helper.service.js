// backend/services/group/management/user.helper.service.js
import User from "../../../models/User.js";

class UserHelperService {
  /**
   * Convert uid to User document
   */
  async uidToUser(uid) {
    const user = await User.findOne({ uid }).select("_id uid nickname avatar");
    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
  }

  /**
   * Convert multiple uids to User documents
   */
  async uidsToUsers(uids) {
    return Promise.all(uids.map((uid) => this.uidToUser(uid)));
  }
}

export default new UserHelperService();