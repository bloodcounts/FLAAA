const { expect } = require('chai');

describe('XACMLConstants', () => {
  let XACMLConstants;

  beforeEach(() => {
    // Clear require cache to get fresh module
    delete require.cache[require.resolve('../../xacml/XACMLConstants')];
    XACMLConstants = require('../../xacml/XACMLConstants');
  });

  it('should export an object with all required constants', () => {
    expect(XACMLConstants).to.be.an('object');
    expect(XACMLConstants).to.have.property('RESOURCE_ID');
    expect(XACMLConstants).to.have.property('RESOURCE_SCOPE_1_0');
    expect(XACMLConstants).to.have.property('RESOURCE_SCOPE_2_0');
    expect(XACMLConstants).to.have.property('XACML_1_0_IDENTIFIER');
    expect(XACMLConstants).to.have.property('XACML_2_0_IDENTIFIER');
    expect(XACMLConstants).to.have.property('XACML_3_0_IDENTIFIER');
    expect(XACMLConstants).to.have.property('XACML_VERSION_1_0');
    expect(XACMLConstants).to.have.property('XACML_VERSION_1_1');
    expect(XACMLConstants).to.have.property('XACML_VERSION_2_0');
    expect(XACMLConstants).to.have.property('XACML_VERSION_3_0');
    expect(XACMLConstants).to.have.property('RESOURCE_CATEGORY');
    expect(XACMLConstants).to.have.property('SUBJECT_CATEGORY');
    expect(XACMLConstants).to.have.property('ACTION_CATEGORY');
    expect(XACMLConstants).to.have.property('SCOPE_IMMEDIATE');
    expect(XACMLConstants).to.have.property('SCOPE_CHILDREN');
    expect(XACMLConstants).to.have.property('SCOPE_DESCENDANTS');
    expect(XACMLConstants).to.have.property('MULTIPLE_CONTENT_SELECTOR');
    expect(XACMLConstants).to.have.property('CONTENT_SELECTOR');
    expect(XACMLConstants).to.have.property('ATTRIBUTES_ELEMENT');
    expect(XACMLConstants).to.have.property('MULTI_REQUESTS');
    expect(XACMLConstants).to.have.property('REQUEST_DEFAULTS');
    expect(XACMLConstants).to.have.property('REQUEST_CONTEXT_1_0_IDENTIFIER');
    expect(XACMLConstants).to.have.property('REQUEST_CONTEXT_2_0_IDENTIFIER');
    expect(XACMLConstants).to.have.property('REQUEST_CONTEXT_3_0_IDENTIFIER');
    expect(XACMLConstants).to.have.property('RETURN_POLICY_LIST');
    expect(XACMLConstants).to.have.property('COMBINE_DECISION');
    expect(XACMLConstants).to.have.property('ATTRIBUTES_CONTENT');
    expect(XACMLConstants).to.have.property('RESOURCE_CONTENT');
    expect(XACMLConstants).to.have.property('ATTRIBUTES_ID');
    expect(XACMLConstants).to.have.property('ATTRIBUTE_ELEMENT');
    expect(XACMLConstants).to.have.property('ATTRIBUTES_CATEGORY');
    expect(XACMLConstants).to.have.property('ANY');
  });

  it('should have correct XACML version constants', () => {
    expect(XACMLConstants.XACML_VERSION_1_0).to.equal(0);
    expect(XACMLConstants.XACML_VERSION_1_1).to.equal(1);
    expect(XACMLConstants.XACML_VERSION_2_0).to.equal(2);
    expect(XACMLConstants.XACML_VERSION_3_0).to.equal(3);
  });

  it('should have correct scope constants', () => {
    expect(XACMLConstants.SCOPE_IMMEDIATE).to.equal(0);
    expect(XACMLConstants.SCOPE_CHILDREN).to.equal(1);
    expect(XACMLConstants.SCOPE_DESCENDANTS).to.equal(2);
  });

  it('should have correct XACML identifiers', () => {
    expect(XACMLConstants.XACML_1_0_IDENTIFIER).to.equal('urn:oasis:names:tc:xacml:1.0:policy');
    expect(XACMLConstants.XACML_2_0_IDENTIFIER).to.equal('urn:oasis:names:tc:xacml:2.0:policy:schema:os');
    expect(XACMLConstants.XACML_3_0_IDENTIFIER).to.equal('urn:oasis:names:tc:xacml:3.0:core:schema:wd-17');
  });

  it('should have correct category constants', () => {
    expect(XACMLConstants.RESOURCE_CATEGORY).to.equal('urn:oasis:names:tc:xacml:3.0:attribute-category:resource');
    expect(XACMLConstants.SUBJECT_CATEGORY).to.equal('urn:oasis:names:tc:xacml:1.0:subject-category:access-subject');
    expect(XACMLConstants.ACTION_CATEGORY).to.equal('urn:oasis:names:tc:xacml:3.0:attribute-category:action');
  });

  it('should have correct resource ID constant', () => {
    expect(XACMLConstants.RESOURCE_ID).to.equal('urn:oasis:names:tc:xacml:1.0:resource:resource-id');
  });

  it('should have correct scope URIs', () => {
    expect(XACMLConstants.RESOURCE_SCOPE_1_0).to.equal('urn:oasis:names:tc:xacml:1.0:resource:scope');
    expect(XACMLConstants.RESOURCE_SCOPE_2_0).to.equal('urn:oasis:names:tc:xacml:2.0:resource:scope');
  });

  it('should have correct content selector constants', () => {
    expect(XACMLConstants.MULTIPLE_CONTENT_SELECTOR).to.equal('urn:oasis:names:tc:xacml:3.0:profile:multiple:content-selector');
    expect(XACMLConstants.CONTENT_SELECTOR).to.equal('urn:oasis:names:tc:xacml:3.0:content-selector');
  });

  it('should have correct XML element constants', () => {
    expect(XACMLConstants.ATTRIBUTES_ELEMENT).to.equal('Attributes');
    expect(XACMLConstants.ATTRIBUTE_ELEMENT).to.equal('Attribute');
    expect(XACMLConstants.ATTRIBUTES_CONTENT).to.equal('Content');
    expect(XACMLConstants.RESOURCE_CONTENT).to.equal('ResourceContent');
  });

  it('should have correct request context identifiers', () => {
    expect(XACMLConstants.REQUEST_CONTEXT_1_0_IDENTIFIER).to.equal('urn:oasis:names:tc:xacml:1.0:context');
    expect(XACMLConstants.REQUEST_CONTEXT_2_0_IDENTIFIER).to.equal('urn:oasis:names:tc:xacml:2.0:context:schema:os');
    expect(XACMLConstants.REQUEST_CONTEXT_3_0_IDENTIFIER).to.equal('urn:oasis:names:tc:xacml:3.0:core:schema:wd-17');
  });

  it('should have correct multi-request constants', () => {
    expect(XACMLConstants.MULTI_REQUESTS).to.equal('MultiRequests');
    expect(XACMLConstants.REQUEST_DEFAULTS).to.equal('RequestDefaults');
    expect(XACMLConstants.RETURN_POLICY_LIST).to.equal('ReturnPolicyIdList');
    expect(XACMLConstants.COMBINE_DECISION).to.equal('CombinedDecision');
  });

  it('should have correct attribute constants', () => {
    expect(XACMLConstants.ATTRIBUTES_ID).to.equal('id');
    expect(XACMLConstants.ATTRIBUTES_CATEGORY).to.equal('Category');
    expect(XACMLConstants.ANY).to.equal('Any');
  });
});