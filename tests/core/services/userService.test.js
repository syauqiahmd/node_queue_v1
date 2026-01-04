const UserService = require('../../../src/core/services/userService');

describe('UserService', () => {
  let userService;
  let mockPrisma;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userOrganization: {
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    userService = new UserService({
      prismaClient: mockPrisma,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return paginated list of users', async () => {
      const payload = { page: 1, pageSize: 10, sortBy: 'userName', sortOrder: 'asc' };
      const mockUsers = [{ id: 1, userName: 'user1' }];
      const mockCount = 1;

      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(mockCount);

      const result = await userService.getAll(payload);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          orderBy: { userName: 'asc' },
        })
      );
      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(result).toEqual({ totalRecord: mockCount, data: mockUsers });
    });

    it('should apply filters correctly', async () => {
      const payload = {
        userName: 'test',
        fullName: 'Test User',
        isActive: 'true',
        page: 1,
        pageSize: 10,
        sortBy: 'userName',
        sortOrder: 'asc',
      };

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await userService.getAll(payload);

      const expectedWhere = {
        userName: { contains: 'test', mode: 'insensitive' },
        fullName: { contains: 'Test User', mode: 'insensitive' },
        isActive: true,
      };

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expectedWhere })
      );
      expect(mockPrisma.user.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('should handle boolean isActive filter "false"', async () => {
      const payload = {
        isActive: 'false',
        page: 1,
        pageSize: 10,
        sortBy: 'userName',
        sortOrder: 'asc',
      };

      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await userService.getAll(payload);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: false }),
        })
      );
    });
  });

  describe('getById', () => {
    it('should return user by id', async () => {
      const id = 'user-1';
      const mockUser = { id, userName: 'user1' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getById(id);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create user and userOrganization if not ADMIN', async () => {
      const data = {
        user: { userName: 'user1', role: 'USER' },
        organization: { id: 'org-1' },
      };
      const mockCreatedUser = { id: 'new-id', ...data.user };
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await userService.create(data);

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userName: 'user1', createdBy: 'System' }),
        })
      );
      expect(mockPrisma.userOrganization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'new-id', organizationId: 'org-1' }),
        })
      );
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create user only if ADMIN', async () => {
      const data = {
        user: { userName: 'admin', role: 'ADMIN' },
        organization: { id: 'org-1' },
      };
      const mockCreatedUser = { id: 'admin-id', ...data.user };
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await userService.create(data);

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.userOrganization.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create user only if no organization provided', async () => {
      const data = {
        user: { userName: 'user1', role: 'USER' },
      };
      const mockCreatedUser = { id: 'new-id', ...data.user };
      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await userService.create(data);

      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.userOrganization.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('update', () => {
    it('should update user and recreate userOrganization if USER role', async () => {
      const id = 'user-1';
      const data = { userName: 'updated', role: 'USER', organizationId: 'org-2' };
      const mockUpdatedUser = { id, userName: 'updated', role: 'USER' };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.update(id, data);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id },
        data: expect.objectContaining({ userName: 'updated' }),
      });
      expect(mockPrisma.userOrganization.deleteMany).toHaveBeenCalledWith({
        where: { userId: id },
      });
      expect(mockPrisma.userOrganization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: id, organizationId: 'org-2' }),
        })
      );
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should update user and remove userOrganization if ADMIN role', async () => {
      const id = 'admin-1';
      const data = { userName: 'updated-admin', role: 'ADMIN', organizationId: 'org-2' };
      const mockUpdatedUser = { id, userName: 'updated-admin', role: 'ADMIN' };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await userService.update(id, data);

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.userOrganization.deleteMany).toHaveBeenCalledWith({
        where: { userId: id },
      });
      expect(mockPrisma.userOrganization.create).not.toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('remove', () => {
    it('should delete user and userOrganization', async () => {
      const id = 'user-1';
      const mockDeletedUser = { id, userName: 'user1' };

      mockPrisma.user.delete.mockResolvedValue(mockDeletedUser);

      const result = await userService.remove(id);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.userOrganization.deleteMany).toHaveBeenCalledWith({
        where: { userId: id },
      });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(mockDeletedUser);
    });
  });

  describe('userDetailByUsername', () => {
    it('should return user details with assigneeOrganization', async () => {
      const userName = 'user1';
      const mockUser = { id: '1', userName };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.userDetailByUsername(userName);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { userName },
        include: {
          assigneeOrganization: {
            include: { organization: true },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });
  });
});
