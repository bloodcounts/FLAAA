const { expect } = require('chai');
const fs = require('fs');
const PolicyInformationPoint = require('../../utils/policyInformationPoint');

describe('PolicyInformationPoint', () => {
  let pip;
  let originalData;

  beforeEach(() => {
    pip = new PolicyInformationPoint();
    // Backup original data if it exists
    try {
      originalData = fs.readFileSync(pip.dataFile, 'utf8');
    } catch (err) {
      originalData = null;
    }
  });

  afterEach(() => {
    // Restore original data
    if (originalData !== null) {
      fs.writeFileSync(pip.dataFile, originalData);
    } else {
      try {
        fs.unlinkSync(pip.dataFile);
      } catch (err) {
        // File doesn't exist, that's fine
      }
    }
  });

  describe('readData()', () => {
    it('should return empty object when file does not exist', () => {
      // Remove the file if it exists
      try {
        fs.unlinkSync(pip.dataFile);
      } catch (err) {
        // File doesn't exist
      }

      const data = pip.readData();
      expect(data).to.deep.equal({});
    });

    it('should parse valid JSON data', () => {
      const testData = { test: 'value', tasks: { task1: { nodes: {} } } };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const data = pip.readData();
      expect(data).to.deep.equal(testData);
    });

    it('should return empty object for invalid JSON', () => {
      fs.writeFileSync(pip.dataFile, 'invalid json');

      const data = pip.readData();
      expect(data).to.deep.equal({});
    });
  });

  describe('getTaskPolicyInfo()', () => {
    it('should return null when task does not exist', () => {
      const testData = { tasks: { task1: {} } };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getTaskPolicyInfo('nonexistent');
      expect(result).to.be.null;
    });

    it('should return task info for existing task', () => {
      const testData = {
        tasks: {
          task1: {
            task_expires: '2026-12-31T23:59:59Z',
            current_date_time: '2025-06-15T12:00:00Z'
          }
        }
      };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getTaskPolicyInfo('task1');
      expect(result).to.deep.equal({
        taskExpires: '2026-12-31T23:59:59Z',
        current_date_time: '2025-06-15T12:00:00Z'
      });
    });

    it('should use default task when specific task not found', () => {
      const testData = {
        tasks: {
          default: {
            task_expires: '2026-12-31T23:59:59Z',
            current_date_time: '2025-06-15T12:00:00Z'
          }
        }
      };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getTaskPolicyInfo('nonexistent');
      expect(result).to.deep.equal({
        taskExpires: '2026-12-31T23:59:59Z',
        current_date_time: '2025-06-15T12:00:00Z'
      });
    });

    it('should handle alternative field names', () => {
      const testData = {
        tasks: {
          task1: {
            taskExpires: '2026-12-31T23:59:59Z',
            currentDateTime: '2025-06-15T12:00:00Z'
          }
        }
      };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getTaskPolicyInfo('task1');
      expect(result).to.deep.equal({
        taskExpires: '2026-12-31T23:59:59Z',
        current_date_time: '2025-06-15T12:00:00Z'
      });
    });

    it('should generate current date time when not provided', () => {
      const testData = {
        tasks: {
          task1: {
            task_expires: '2026-12-31T23:59:59Z'
          }
        }
      };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getTaskPolicyInfo('task1');
      expect(result).to.have.property('taskExpires', '2026-12-31T23:59:59Z');
      expect(result).to.have.property('current_date_time');
      expect(result.current_date_time).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return null when file read fails', () => {
      // Make file unreadable
      fs.writeFileSync(pip.dataFile, '');
      // Remove read permission (this might not work on all systems)
      try {
        fs.chmodSync(pip.dataFile, 0o000);
        const result = pip.getTaskPolicyInfo('task1');
        expect(result).to.be.null;
      } finally {
        try {
          fs.chmodSync(pip.dataFile, 0o644);
        } catch (err) {
          // Ignore
        }
      }
    });
  });

  describe('getMembershipInfo()', () => {
    it('should return null when task does not exist', () => {
      const testData = { tasks: { task1: { nodes: {} } } };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getMembershipInfo('nonexistent', 'node1');
      expect(result).to.be.null;
    });

    it('should return null when node does not exist', () => {
      const testData = {
        tasks: {
          task1: {
            nodes: {},
            task_expires: '2026-12-31T23:59:59Z'
          }
        }
      };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getMembershipInfo('task1', 'nonexistent');
      expect(result).to.be.null;
    });

    it('should return membership info for existing task and node', () => {
      const testData = {
        tasks: {
          task1: {
            task_expires: '2026-12-31T23:59:59Z',
            current_date_time: '2025-06-15T12:00:00Z',
            nodes: {
              node1: {
                is_member_of_task: true,
                task_membership_expires: '2026-06-15T12:00:00Z',
                task_role: 'participant'
              }
            }
          }
        }
      };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getMembershipInfo('task1', 'node1');
      expect(result).to.deep.equal({
        taskExpires: '2026-12-31T23:59:59Z',
        isMember: 'true',
        taskMembershipExpires: '2026-06-15T12:00:00Z',
        taskRole: 'participant',
        current_date_time: '2025-06-15T12:00:00Z'
      });
    });

    it('should use default node when specific node not found', () => {
      const testData = {
        tasks: {
          task1: {
            nodes: {
              default: {
                is_member_of_task: false,
                task_role: 'observer'
              }
            }
          }
        }
      };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getMembershipInfo('task1', 'nonexistent');
      expect(result).to.have.property('isMember', 'false');
      expect(result).to.have.property('taskRole', 'observer');
    });

    it('should handle alternative field names', () => {
      const testData = {
        tasks: {
          task1: {
            taskExpires: '2026-12-31T23:59:59Z',
            nodes: {
              node1: {
                isMemberOfTask: true,
                taskMembershipExpires: '2026-06-15T12:00:00Z',
                taskRole: 'participant'
              }
            }
          }
        }
      };
      fs.writeFileSync(pip.dataFile, JSON.stringify(testData));

      const result = pip.getMembershipInfo('task1', 'node1');
      expect(result).to.have.property('isMember', 'true');
      expect(result).to.have.property('taskMembershipExpires', '2026-06-15T12:00:00Z');
      expect(result).to.have.property('taskRole', 'participant');
    });
  });
});