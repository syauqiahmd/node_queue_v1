const {
  createOrganizationSchema,
  updateOrganizationSchema,
} = require('../../../src/api/validation/organization.schema');

describe('organization schema', () => {
  it('accepts an empty fullName on create (field is optional in the UI)', () => {
    const { error } = createOrganizationSchema.validate({ name: 'ORG', fullName: '' });
    expect(error).toBeUndefined();
  });

  it('accepts an empty or null fullName on update so it can be cleared', () => {
    expect(
      updateOrganizationSchema.validate({ name: 'ORG', fullName: '', isActive: true }).error
    ).toBeUndefined();
    expect(
      updateOrganizationSchema.validate({ name: 'ORG', fullName: null, isActive: true }).error
    ).toBeUndefined();
  });

  it('still requires name', () => {
    expect(createOrganizationSchema.validate({ fullName: 'Org' }).error).toBeDefined();
  });
});
