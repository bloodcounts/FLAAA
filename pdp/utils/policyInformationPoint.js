const fs = require('fs');
const path = require('path');

class PolicyInformationPoint {
  constructor() {
    this.dataFile = path.join(__dirname, '..', 'sample_data', 'nodes.json');
  }

  readData() {
    try {
      const raw = fs.readFileSync(this.dataFile, 'utf8');
      return JSON.parse(raw || '{}');
    } catch (err) {
      // File doesn't exist, can't be read, or contains invalid JSON
      return {};
    }
  }

  getTaskPolicyInfo(taskId) {
    try {
      const data = this.readData();
      const task = (data.tasks || {})[taskId] || (data.tasks || {}).default || null;
      if (!task) return null;
      return {
        taskExpires: task.task_expires || task.taskExpires,
        current_date_time: task.current_date_time
          || task.current_dateTime
          || task.currentDateTime
          || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  getMembershipInfo(taskId, nodeId) {
    try {
      const data = this.readData();
      const task = (data.tasks || {})[taskId] || (data.tasks || {}).default || null;
      if (!task) return null;
      const nodeInfo = (task.nodes || {})[nodeId] || (task.nodes || {}).default || null;
      if (!nodeInfo) return null;
      const isMemberRaw = nodeInfo.is_member_of_task !== undefined
        ? nodeInfo.is_member_of_task
        : nodeInfo.isMemberOfTask;
      return {
        taskExpires: task.task_expires || task.taskExpires,
        isMember: isMemberRaw !== undefined ? String(isMemberRaw) : undefined,
        taskMembershipExpires:
          nodeInfo.task_membership_expires
          || nodeInfo.taskMembershipExpires
          || task.task_membership_expires,
        taskRole: nodeInfo.task_role || nodeInfo.taskRole || task.task_role || task.taskRole,
        current_date_time: task.current_date_time
          || task.currentDateTime
          || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  getMembershipTypeInfo(taskId) {
    try {
      const data = this.readData();
      const task = (data.tasks || {})[taskId] || (data.tasks || {}).default || null;
      if (!task) return null;
      const defaultNode = (task.nodes || {}).default || null;
      if (!defaultNode) return null;
      const isMemberRaw = defaultNode.is_member_of_task !== undefined
        ? defaultNode.is_member_of_task
        : defaultNode.isMemberOfTask;
      return {
        taskExpires: task.task_expires || task.taskExpires,
        isMember: isMemberRaw !== undefined ? String(isMemberRaw) : undefined,
        taskMembershipExpires:
          defaultNode.task_membership_expires
          || defaultNode.taskMembershipExpires
          || task.task_membership_expires,
        taskRole: defaultNode.task_role || defaultNode.taskRole,
        current_dateTime: task.current_dateTime || task.currentDateTime || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }
}

module.exports = PolicyInformationPoint;
