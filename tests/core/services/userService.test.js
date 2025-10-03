const UserService = require('@src/core/services/userService');
const { BusinessError } = require('@src/infra/utils/businessException');

describe('UserService', () => {
  let userService;
  let prismaClient;
  let businessException;

  beforeEach(() => {
    prismaClient = {
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
      },
    };
    businessException = {
      NotFound: jest.fn(
        (item) => new BusinessError({ message: `${item} not found`, statusCode: 404 })
      ),
    };

    userService = new UserService({
      prismaClient,
      businessException,
    });
  });

  describe('getAll', () => {
    it('should return a list of users', async () => {
      const mockUsers = [{ id: 'u1' }];
      prismaClient.user.findMany.mockResolvedValue(mockUsers);
      prismaClient.user.count.mockResolvedValue(1);

      const result = await userService.getAll({});

      expect(prismaClient.user.findMany).toHaveBeenCalled();
      expect(prismaClient.user.count).toHaveBeenCalled();
      expect(result).toEqual({ totalRecord: 1, data: mockUsers });
    });

    it('should apply filters', async () => {
      const mockUsers = [{ id: 'u1' }];
      prismaClient.user.findMany.mockResolvedValue(mockUsers);
      prismaClient.user.count.mockResolvedValue(1);

      const result = await userService.getAll({
        userName: 'test',
        fullName: 'Test User',
        isActive: 'true',
        page: 1,
        pageSize: 10,
      });

      expect(prismaClient.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userName: { contains: 'test', mode: 'insensitive' },
            fullName: { contains: 'Test User', mode: 'insensitive' },
            isActive: true,
          }),
          skip: 0,
          take: 10,
        })
      );
      expect(result).toEqual({ totalRecord: 1, data: mockUsers });
    });

    it('should handle isActive false filter', async () => {
      const mockUsers = [{ id: 'u1' }];
      prismaClient.user.findMany.mockResolvedValue(mockUsers);
      prismaClient.user.count.mockResolvedValue(1);

      const result = await userService.getAll({
        isActive: 'false',
      });

      expect(prismaClient.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        })
      );
      expect(result).toEqual({ totalRecord: 1, data: mockUsers });
    });
  });

  describe('getById', () => {
    it('should return a user by ID', async () => {
      const mockUser = { id: 'u1' };
      prismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.getById('u1');

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const mockUser = { id: 'u1', userName: 'test' };
      prismaClient.user.create.mockResolvedValue(mockUser);

      const result = await userService.create({ user: { userName: 'test' } });

      expect(prismaClient.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userName: 'test',
            createdBy: 'System',
            updatedBy: 'System',
          }),
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should create user with organization', async () => {
      const mockUser = { id: 'u1', userName: 'test' };
      prismaClient.user.create.mockResolvedValue(mockUser);
      prismaClient.userOrganization.create.mockResolvedValue({});

      const result = await userService.create({
        user: { userName: 'test' },
        organization: { id: 'org1' },
      });

      expect(prismaClient.userOrganization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u1',
            organizationId: 'org1',
          }),
        })
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const mockUser = { id: 'u1', userName: 'updated' };
      prismaClient.user.update.mockResolvedValue(mockUser);

      const result = await userService.update('u1', { userName: 'updated' });

      expect(prismaClient.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { userName: 'updated' },
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const mockUser = { id: 'u1' };
      prismaClient.user.delete.mockResolvedValue(mockUser);

      const result = await userService.remove('u1');

      expect(prismaClient.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(result).toEqual(mockUser);
    });
  });

  describe('userDetailByUsername', () => {
    it('should return user detail by username', async () => {
      const mockUser = { id: 'u1', userName: 'test' };
      prismaClient.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.userDetailByUsername('test');

      expect(prismaClient.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userName: 'test' },
          include: expect.any(Object),
        })
      );
      expect(result).toEqual(mockUser);
    });
  });
});
