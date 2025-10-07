const asyncContext = require('../../infra/utils/asyncContext');

class IdentityHelper {
  getCurrentUser() {
    return asyncContext.getUser();
  }

  getCurrentUserId() {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  getCurrentUserName() {
    const user = this.getCurrentUser();
    return user ? user.userName : null;
  }

  getCurrentUserFullName() {
    const user = this.getCurrentUser();
    return user ? user.fullName : null;
  }

  getCurrentUserRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }

  isCurrentUserActive() {
    const user = this.getCurrentUser();
    return user ? user.isActive : false;
  }

  getCurrentUserOrganization() {
    const user = this.getCurrentUser();
    return user ? user.organization : null;
  }

  getCurrentUserOrganizationId() {
    const user = this.getCurrentUser();
    return user && user.organization ? user.organization.organizationId : null;
  }
}

module.exports = IdentityHelper;
