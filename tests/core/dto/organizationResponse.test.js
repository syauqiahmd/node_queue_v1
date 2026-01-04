const { OrganizationResponse } = require('../../../src/core/dto/organizationResponse');

describe('OrganizationResponse', () => {
  it('should map organization with logoUrl', () => {
    const org = {
      id: 'org-1',
      name: 'Org 1',
      fullName: 'Organization 1',
      logoUrl: 'http://logo.url',
      services: [],
    };
    const response = new OrganizationResponse(org);
    expect(response.logoUrl).toBe('http://logo.url');
  });

  it('should map organization without logoUrl', () => {
    const org = {
      id: 'org-1',
      name: 'Org 1',
      fullName: 'Organization 1',
      // logoUrl missing
      services: [],
    };
    const response = new OrganizationResponse(org);
    expect(response.logoUrl).toBeNull();
  });

  it('should map services correctly', () => {
    const org = {
      id: 'org-1',
      name: 'Org 1',
      fullName: 'Organization 1',
      services: [{ id: 'svc-1', name: 'Service 1', prefix: 'S1' }],
    };
    const response = new OrganizationResponse(org);
    expect(response.services).toHaveLength(1);
    expect(response.services[0].serviceId).toBe('svc-1');
    expect(response.services[0].name).toBe('Service 1');
    expect(response.services[0].prefix).toBe('S1');
  });
});
