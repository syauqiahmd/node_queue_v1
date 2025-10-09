const IdentityHelper = require('../../../src/api/utils/identityHelper');
const asyncContext = require('../../../src/infra/utils/asyncContext');

// Mock the asyncContext
jest.mock('../../../src/infra/utils/asyncContext');

describe('IdentityHelper', () => {
  let identityHelper;
  const mockUser = {
    id: 'b996a776-16de-49dc-bcd1-460a174aa6a2',
    userName: 'test',
    fullName: 'Test Organization',
    role: 'ADMIN',
    isActive: true,
    organization: {
      organizationId: 'a7c82844-5e16-4af1-8182-1b8474599143',
      name: 'test',
      fullName: '',
    },
  };

  beforeEach(() => {
    identityHelper = new IdentityHelper();
    asyncContext.getUser.mockReturnValue(mockUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get the current user', () => {
    const user = identityHelper.getCurrentUser();
    expect(user).toEqual(mockUser);
  });

  it('should get the current user id', () => {
    const userId = identityHelper.getCurrentUserId();
    expect(userId).toBe(mockUser.id);
  });

  it('should get the current user name', () => {
    const userName = identityHelper.getCurrentUserName();
    expect(userName).toBe(mockUser.userName);
  });

  it('should get the current user full name', () => {
    const fullName = identityHelper.getCurrentUserFullName();
    expect(fullName).toBe(mockUser.fullName);
  });

  it('should get the current user role', () => {
    const role = identityHelper.getCurrentUserRole();
    expect(role).toBe(mockUser.role);
  });

  it('should check if the current user is active', () => {
    const isActive = identityHelper.isCurrentUserActive();
    expect(isActive).toBe(mockUser.isActive);
  });

  it('should get the current user organization', () => {
    const organization = identityHelper.getCurrentUserOrganization();
    expect(organization).toEqual(mockUser.organization);
  });

  it('should get the current user organization id', () => {
    const organizationId = identityHelper.getCurrentUserOrganizationId();
    expect(organizationId).toBe(mockUser.organization.organizationId);
  });

  describe('when user is not logged in', () => {
    beforeEach(() => {
      asyncContext.getUser.mockReturnValue(null);
    });

    it('should return null for all properties', () => {
      expect(identityHelper.getCurrentUser()).toBeNull();
      expect(identityHelper.getCurrentUserId()).toBeNull();
      expect(identityHelper.getCurrentUserName()).toBeNull();
      expect(identityHelper.getCurrentUserFullName()).toBeNull();
      expect(identityHelper.getCurrentUserRole()).toBeNull();
      expect(identityHelper.isCurrentUserActive()).toBe(false);
      expect(identityHelper.getCurrentUserOrganization()).toBeNull();
      expect(identityHelper.getCurrentUserOrganizationId()).toBeNull();
    });
  });
});
