const fs = require('fs');
const path = require('path');

function _readData() {
  const file = path.join(__dirname, '..', 'sample_data', 'nodes.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw || '{}');
}

function getTaskPolicyInfo(taskId) {
  try {
    const data = _readData();
    const tasks = data.tasks || {};
    const info = tasks[taskId] || tasks.default || null;
    if (!info) return null;
    const taskExpires = info.task_expires || info.taskExpires;
    const now = info.current_dateTime || info.currentDateTime || new Date().toISOString();
    return { taskExpires, current_date_time: now };
  } catch (err) {
    return null;
  }
}

function getMembershipInfo(taskId, nodeId) {
  try {
    const data = _readData();
    const tasks = data.tasks || {};
    const task = tasks[taskId] || tasks.default || null;
    if (!task) return null;
    const taskExpires = task.task_expires || task.taskExpires;
    const nodes = task.nodes || {};
    const nodeInfo = nodes[nodeId] || nodes.default || null;
    if (!nodeInfo) return null;
    const isMemberRaw = nodeInfo.is_member_of_task !== undefined ? nodeInfo.is_member_of_task : (nodeInfo.isMemberOfTask !== undefined ? nodeInfo.isMemberOfTask : undefined);
    const isMember = isMemberRaw !== undefined ? String(isMemberRaw) : undefined;
    const taskMembershipExpires = nodeInfo.task_membership_expires || nodeInfo.taskMembershipExpires || task.task_membership_expires;
    const taskRole = nodeInfo.task_role || nodeInfo.taskRole || task.task_role || task.taskRole;
    const now = task.current_date_time || task.currentDateTime || new Date().toISOString();
    return { taskExpires, isMember, taskMembershipExpires, taskRole, current_date_time: now };
  } catch (err) {
    return null;
  }
}

function getMembershipTypeInfo(taskId) {
  try {
    const data = _readData();
    const tasks = data.tasks || {};
    const task = tasks[taskId] || tasks.default || null;
    if (!task) return null;
    const taskExpires = task.task_expires || task.taskExpires;
    const nodes = task.nodes || {};
    const defaultNode = nodes.default || null;
    if (!defaultNode) return null;
    const isMemberRaw = defaultNode.is_member_of_task !== undefined ? defaultNode.is_member_of_task : (defaultNode.isMemberOfTask !== undefined ? defaultNode.isMemberOfTask : undefined);
    const isMember = isMemberRaw !== undefined ? String(isMemberRaw) : undefined;
    const taskMembershipExpires = defaultNode.task_membership_expires || defaultNode.taskMembershipExpires || task.task_membership_expires;
    const taskRole = defaultNode.task_role || defaultNode.taskRole;
    const now = task.current_dateTime || task.currentDateTime || new Date().toISOString();
    return { taskExpires, isMember, taskMembershipExpires, taskRole, current_dateTime: now };
  } catch (err) {
    return null;
  }
}

module.exports = { getTaskPolicyInfo, getMembershipInfo, getMembershipTypeInfo };
