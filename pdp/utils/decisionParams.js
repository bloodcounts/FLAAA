// Build XACML request XML strings from query parameters.
// Each function returns a string containing the XML request, or null if required params are missing.

function escapeXml(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const pip = require('./policyInformationPoint');

function buildTaskApprovalRequest(params) {
  const taskId = params.task_id || params.taskId || params.task || params.id;
  if (!taskId) return null;
  const info = pip.getTaskPolicyInfo(taskId);
  if (!info) return null;
  const action = 'task-authorization';
  const taskExpires = info.taskExpires || info.task_expires || '2026-12-31T23:59:59Z';
  const now = info.current_dateTime || info.currentDateTime || new Date().toISOString();
  // Build the exact requested template: action, task_id, task_expires, and current-dateTime
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17">\n\n  <!-- Action -->\n  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">\n    <Attribute AttributeId="action" IncludeInResult="false">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(action)}</AttributeValue>\n    </Attribute>\n  </Attributes>\n\n  <!-- Resource: task-scoped federation -->\n  <Attributes Category="urn:oasis:names:tc:xacml:1.0:attribute-category:resource">\n    <Attribute AttributeId="task_id" IncludeInResult="false">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(taskId)}</AttributeValue>\n    </Attribute>\n\n    <!-- Must be later than current-dateTime -->\n    <Attribute AttributeId="task_expires" IncludeInResult="false">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${escapeXml(taskExpires)}</AttributeValue>\n    </Attribute>\n  </Attributes>\n\n  <!-- Environment -->\n  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment">\n    <Attribute AttributeId="current-dateTime" IncludeInResult="false">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${escapeXml(now)}</AttributeValue>\n    </Attribute>\n  </Attributes>\n\n</Request>`;
}

function buildMembershipValidationRequest(params) {
  // Expected query params: task_id, task_expires, node_id, is_member_of_task, task_membership_expires
  // Example:
  // curl 'http://localhost:3000/getDecision?action=membership_validation&task_id=medical&task_expires=2026-12-31T23:59:59Z&node_id=15692499009958989137&is_member_of_task=true&task_membership_expires=2026-12-31T23:59:59Z'
  const nodeId = params.node_id || params.nodeId || params.node;
  const taskId = params.task_id || params.taskId || params.task || params.id;
  if (!nodeId || !taskId) return null;
  const info = pip.getMembershipInfo(taskId, nodeId);
  if (!info) return null;
  const taskExpires = info.taskExpires || info.task_expires || '2026-12-31T23:59:59Z';
  const isMember = info.isMember || info.is_member_of_task || 'false';
  const taskMembershipExpires = info.taskMembershipExpires || info.task_membership_expires || '2026-12-31T23:59:59Z';
  const action = 'node-activation';
  const now = info.current_dateTime || info.currentDateTime || new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>\n<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17">\n\n  <!-- Action: Node Activation -->\n  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">\n    <Attribute AttributeId="action">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(action)}</AttributeValue>\n    </Attribute>\n  </Attributes>\n\n  <!-- Resource: Task (task-scoped federation) -->\n  <Attributes Category="urn:oasis:names:tc:xacml:1.0:attribute-category:resource">\n    <Attribute AttributeId="task_id">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(taskId)}</AttributeValue>\n    </Attribute>\n\n    <!-- Must be strictly greater than current-dateTime -->\n    <Attribute AttributeId="task_expires">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${escapeXml(taskExpires)}</AttributeValue>\n    </Attribute>\n  </Attributes>\n\n  <!-- Subject: Node (task-scoped membership) -->\n  <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject">\n\n    <Attribute AttributeId="node_id">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(nodeId)}</AttributeValue>\n    </Attribute>\n\n    <Attribute AttributeId="is_member_of_task">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#boolean">${escapeXml(isMember)}</AttributeValue>\n    </Attribute>\n\n    <!-- Must be strictly greater than current-dateTime -->\n    <Attribute AttributeId="task_membership_expires">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${escapeXml(taskMembershipExpires)}</AttributeValue>\n    </Attribute>\n\n  </Attributes>\n\n  <!-- Environment: Current DateTime -->\n  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment">\n    <Attribute AttributeId="current-dateTime">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${escapeXml(now)}</AttributeValue>\n    </Attribute>\n  </Attributes>\n\n</Request>`;
}

function buildMembershipTypeRequest(params) {
  // Expected query params: action (optional override), task_id, node_id (optional)
  // Other fields are retrieved from the policy information point (nodes.json)
  const taskId = params.task_id || params.taskId || params.task || params.id;
  const nodeId = params.node_id || params.nodeId || params.node;
  if (!taskId) return null;
  let info = null;
  if (nodeId) {
    info = pip.getMembershipInfo(taskId, nodeId);
  }
  if (!info) {
    info = pip.getMembershipTypeInfo(taskId);
  }
  if (!info) return null;
  const taskExpires = info.taskExpires || info.task_expires || '2026-12-31T23:59:59Z';
  const isMember = info.isMember || info.is_member_of_task || 'true';
  const taskMembershipExpires = info.taskMembershipExpires || info.task_membership_expires || '2026-12-31T23:59:59Z';
  const taskRole = info.taskRole || info.task_role || 'participant';
  let action = params.action;
  console.log('Requested action:>>>>>', action);
  const now = info.current_date_time || info.currentDateTime || info.current_dateTime || info.currentDateTime || new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>\n<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17">\n\n  <!-- Action: ${action === 'train' ? 'Train' : 'Evaluate'} -->\n  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">\n    <Attribute AttributeId="action">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(action)}</AttributeValue>\n    </Attribute>\n  </Attributes>\n\n  <!-- Resource: Task -->\n  <Attributes Category="urn:oasis:names:tc:xacml:1.0:attribute-category:resource">\n    <Attribute AttributeId="task_id">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(taskId)}</AttributeValue>\n    </Attribute>\n\n    <!-- Must be strictly greater than current-dateTime -->\n    <Attribute AttributeId="task_expires">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${escapeXml(taskExpires)}</AttributeValue>\n    </Attribute>\n  </Attributes>\n\n  <!-- Subject: Node -->\n  <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject">\n\n    <Attribute AttributeId="is_member_of_task">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#boolean">${escapeXml(isMember)}</AttributeValue>\n    </Attribute>\n\n    <!-- Must be strictly greater than current-dateTime -->\n    <Attribute AttributeId="task_membership_expires">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${escapeXml(taskMembershipExpires)}</AttributeValue>\n    </Attribute>\n\n    <!-- participant can train/aggregate -->\n    <Attribute AttributeId="task_role">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">${escapeXml(taskRole)}</AttributeValue>\n    </Attribute>\n\n  </Attributes>\n\n  <!-- Environment -->\n  <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:environment">\n    <Attribute AttributeId="current-dateTime">\n      <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#dateTime">${escapeXml(now)}</AttributeValue>\n    </Attribute>\n  </Attributes>\n\n</Request>`;
}

function getRequestXML(action, params) {
  if (!action) return null;
  const key = String(action).toLowerCase();
  switch (key) {
    case 'task_approval':
    case 'task-approval':
    case 'taks_approval':
    case 'taskapproval':
      return buildTaskApprovalRequest(params);

    case 'membership_validation':
    case 'membership-validation':
    case 'memebership_validation':
    case 'membershipvalidation':
      return buildMembershipValidationRequest(params);

    case 'train':
    case 'evaluate':
      return buildMembershipTypeRequest(params);

    default:
      return null;
  }
}

module.exports = { getRequestXML };
