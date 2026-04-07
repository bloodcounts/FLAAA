const { expect } = require('chai');
const DecisionParamsBuilder = require('../../utils/decisionParams');

describe('DecisionParamsBuilder', () => {
  let pip;
  let builder;

  beforeEach(() => {
    // Mock PIP
    pip = {
      getTaskPolicyInfo: (taskId) => {
        if (taskId === 'medical' || taskId === 'test&id') {
          return {
            taskExpires: '2026-12-31T23:59:59Z',
            current_date_time: '2025-06-15T12:00:00Z'
          };
        }
        return null;
      }
    };
    builder = new DecisionParamsBuilder(pip);
  });

  describe('build()', () => {
    it('should return null when taskId is not provided', () => {
      const result = builder.build('task-approval', {});
      expect(result).to.be.null;
    });

    it('should return null when PIP returns null for task', () => {
      const result = builder.build('task-approval', { task_id: 'nonexistent' });
      expect(result).to.be.null;
    });

    it('should build valid XML for task authorization', () => {
      const result = builder.build('task-approval', { task_id: 'medical' });

      expect(result).to.be.a('string');
      expect(result).to.include('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).to.include('<Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17">');
      expect(result).to.include('<Attribute AttributeId="action"');
      expect(result).to.include('task-authorization');
      expect(result).to.include('<Attribute AttributeId="task_id"');
      expect(result).to.include('medical');
      expect(result).to.include('<Attribute AttributeId="task_expires"');
      expect(result).to.include('2026-12-31T23:59:59Z');
      expect(result).to.include('<Attribute AttributeId="current-dateTime"');
      expect(result).to.include('2025-06-15T12:00:00Z');
    });

    it('should handle different parameter names', () => {
      const result = builder.build('task-approval', { taskId: 'medical' });
      expect(result).to.include('medical');
    });

    it('should use default values when PIP data is incomplete', () => {
      pip.getTaskPolicyInfo = () => ({
        taskExpires: '2026-12-31T23:59:59Z'
        // missing current_date_time
      });

      const result = builder.build('task-approval', { task_id: 'medical' });
      expect(result).to.include('2026-12-31T23:59:59Z');
      expect(result).to.match(/current-dateTime[\s\S]*?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should escape XML special characters in parameters', () => {
      const result = builder.build('task-approval', { task_id: 'test&id' });
      expect(result).to.include('test&amp;id');
    });

    it('should return null for unsupported actions', () => {
      const result = builder.build('unsupported-action', { task_id: 'medical' });
      expect(result).to.be.null;
    });
  });

  describe('XML structure validation', () => {
    it('should produce valid XML structure', () => {
      const result = builder.build('task-approval', { task_id: 'medical' });

      // Check that it starts with XML declaration
      expect(result).to.match(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);

      // Check that it has proper closing tags
      expect(result).to.include('</Request>');
      expect(result).to.include('</Attributes>');

      // Check that all tags are properly closed
      const openTags = result.match(/<[^/?][^>]*>/g) || [];
      const closeTags = result.match(/<\/[^>]+>/g) || [];
      const selfClosingTags = result.match(/<[^>]+\/>/g) || [];

      expect(openTags.length).to.equal(closeTags.length + selfClosingTags.length);
    });

    it('should include all required XACML attributes', () => {
      const result = builder.build('task-approval', { task_id: 'medical' });

      expect(result).to.include('urn:oasis:names:tc:xacml:3.0:attribute-category:action');
      expect(result).to.include('urn:oasis:names:tc:xacml:1.0:attribute-category:resource');
      expect(result).to.include('urn:oasis:names:tc:xacml:3.0:attribute-category:environment');
    });
  });
});