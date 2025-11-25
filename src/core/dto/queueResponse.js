class QueueResponse {
  monitorCurrentQueue(data = []) {
    if (!data) {
      return [];
    }

    return data.map((item) => {
      return {
        id: item.id,
        queueNumber: `${item.prefix}-${item.queueNumber}`,
        serviceId: item.serviceId,
        serviceName: item.service.name,
        organizationId: item.service.organization.id,
        organizationName: item.service.organization.name,
        organizationFullName: item.service.organization.fullName,
        organizationLogoUrl: item.service.organization.logoUrl || null,
        counterNumber: item.latestAssigneeCounter.counterNumber,
      };
    });
  }
}

module.exports = QueueResponse;
