class OrganizationResponse {
  constructor(organization) {
    this.id = organization.id;
    this.name = organization.name;
    this.fullName = organization.fullName;
    this.services = organization.services.map((service) => new ServiceResponse(service));
  }
}

class ServiceResponse {
  constructor(service) {
    this.serviceId = service.id;
    this.name = service.name;
    this.prefix = service.prefix;
  }
}

module.exports = { OrganizationResponse, ServiceResponse };
