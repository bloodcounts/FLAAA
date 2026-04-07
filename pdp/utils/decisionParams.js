// Builds XACML request XML strings from query parameters.

class DecisionParamsBuilder {
  constructor(pip) {
    this.pip = pip;
  }

  static #escapeXml(str) {
    if (str === undefined || str === null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  #buildTaskApproval(params) {
    const taskId = params.task_id || params.taskId || params.task || params.id;
    if (!taskId) return null;
    const info = this.pip.getTaskPolicyInfo(taskId);
    if (!info) return null;
    const action = 'task-authorization';
    const taskExpires = info.taskExpires || info.task_expires || '2026-12-31T23:59:59Z';
    const now = info.current_date_time || info.currentDateTime || new Date().toISOString();
    const x = DecisionParamsBuilder.#escapeXml;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17">
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
    <Attribute AttributeId="action" IncludeInResult="false">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${x(action)}</AttributeValue>
    </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:1.0:attribute-category:resource">
    <Attribute AttributeId="task_id" IncludeInResult="false">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${x(taskId)}</AttributeValue>
    </Attribute>
    <Attribute AttributeId="task_expires" IncludeInResult="false">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${x(taskExpires)}</AttributeValue>
    </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment">
    <Attribute AttributeId="current-dateTime" IncludeInResult="false">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${x(now)}</AttributeValue>
    </Attribute>
  </Attributes>
</Request>`;
  }

  #buildMembershipValidation(params) {
    const nodeId = params.node_id || params.nodeId || params.node;
    const taskId = params.task_id || params.taskId || params.task || params.id;
    if (!nodeId || !taskId) return null;
    const info = this.pip.getMembershipInfo(taskId, nodeId);
    if (!info) return null;
    const action = 'node-activation';
    const taskExpires = info.taskExpires || info.task_expires || '2026-12-31T23:59:59Z';
    const isMember = info.isMember || info.is_member_of_task || 'false';
    const taskMembershipExpires = info.taskMembershipExpires || info.task_membership_expires || '2026-12-31T23:59:59Z';
    const now = info.current_date_time || info.currentDateTime || new Date().toISOString();
    const x = DecisionParamsBuilder.#escapeXml;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17">
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
    <Attribute AttributeId="action">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${x(action)}</AttributeValue>
    </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:1.0:attribute-category:resource">
    <Attribute AttributeId="task_id">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${x(taskId)}</AttributeValue>
    </Attribute>
    <Attribute AttributeId="task_expires">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${x(taskExpires)}</AttributeValue>
    </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject">
    <Attribute AttributeId="node_id">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${x(nodeId)}</AttributeValue>
    </Attribute>
    <Attribute AttributeId="is_member_of_task">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#boolean">${x(isMember)}</AttributeValue>
    </Attribute>
    <Attribute AttributeId="task_membership_expires">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${x(taskMembershipExpires)}</AttributeValue>
    </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment">
    <Attribute AttributeId="current-dateTime">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${x(now)}</AttributeValue>
    </Attribute>
  </Attributes>
</Request>`;
  }

  #buildMembershipType(params) {
    const taskId = params.task_id || params.taskId || params.task || params.id;
    const nodeId = params.node_id || params.nodeId || params.node;
    if (!taskId) return null;
    const info = nodeId
      ? this.pip.getMembershipInfo(taskId, nodeId) || this.pip.getMembershipTypeInfo(taskId)
      : this.pip.getMembershipTypeInfo(taskId);
    if (!info) return null;
    const { action } = params;
    const taskExpires = info.taskExpires || info.task_expires || '2026-12-31T23:59:59Z';
    const isMember = info.isMember || info.is_member_of_task || 'true';
    const taskMembershipExpires = info.taskMembershipExpires || info.task_membership_expires || '2026-12-31T23:59:59Z';
    const taskRole = info.taskRole || info.task_role || 'participant';
    const now = info.current_date_time || info.currentDateTime || new Date().toISOString();
    const x = DecisionParamsBuilder.#escapeXml;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17">
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
    <Attribute AttributeId="action">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${x(action)}</AttributeValue>
    </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:1.0:attribute-category:resource">
    <Attribute AttributeId="task_id">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${x(taskId)}</AttributeValue>
    </Attribute>
    <Attribute AttributeId="task_expires">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${x(taskExpires)}</AttributeValue>
    </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject">
    <Attribute AttributeId="is_member_of_task">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#boolean">${x(isMember)}</AttributeValue>
    </Attribute>
    <Attribute AttributeId="task_membership_expires">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${x(taskMembershipExpires)}</AttributeValue>
    </Attribute>
    <Attribute AttributeId="task_role">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${x(taskRole)}</AttributeValue>
    </Attribute>
  </Attributes>
  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment">
    <Attribute AttributeId="current-dateTime">
      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${x(now)}</AttributeValue>
    </Attribute>
  </Attributes>
</Request>`;
  }

  build(action, params) {
    if (!action) return null;
    switch (String(action).toLowerCase()) {
      case 'task_approval':
      case 'task-approval':
      case 'taks_approval': // backward-compat typo alias
      case 'taskapproval':
        return this.#buildTaskApproval(params);

      case 'membership_validation':
      case 'membership-validation':
      case 'memebership_validation': // backward-compat typo alias
      case 'membershipvalidation':
        return this.#buildMembershipValidation(params);

      case 'train':
      case 'evaluate':
        return this.#buildMembershipType(params);

      default:
        return null;
    }
  }
}

module.exports = DecisionParamsBuilder;
