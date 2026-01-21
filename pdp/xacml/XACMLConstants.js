/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const XACMLConstants = {
    RESOURCE_ID: "urn:oasis:names:tc:xacml:1.0:resource:resource-id",
    RESOURCE_SCOPE_1_0: "urn:oasis:names:tc:xacml:1.0:resource:scope",
    RESOURCE_SCOPE_2_0: "urn:oasis:names:tc:xacml:2.0:resource:scope",
    XACML_1_0_IDENTIFIER: "urn:oasis:names:tc:xacml:1.0:policy",
    XACML_2_0_IDENTIFIER: "urn:oasis:names:tc:xacml:2.0:policy:schema:os",
    XACML_3_0_IDENTIFIER: "urn:oasis:names:tc:xacml:3.0:core:schema:wd-17",
    XACML_VERSION_1_0: 0,
    XACML_VERSION_1_1: 1,
    XACML_VERSION_2_0: 2,
    XACML_VERSION_3_0: 3,
    RESOURCE_CATEGORY: "urn:oasis:names:tc:xacml:3.0:attribute-category:resource",
    SUBJECT_CATEGORY: "urn:oasis:names:tc:xacml:1.0:subject-category:access-subject",
    ACTION_CATEGORY: "urn:oasis:names:tc:xacml:3.0:attribute-category:action",
    SCOPE_IMMEDIATE: 0,
    SCOPE_CHILDREN: 1,
    SCOPE_DESCENDANTS: 2,
    MULTIPLE_CONTENT_SELECTOR: "urn:oasis:names:tc:xacml:3.0:profile:" +
      "multiple:content-selector",
    CONTENT_SELECTOR: "urn:oasis:names:tc:xacml:3.0:content-selector",
    ATTRIBUTES_ELEMENT: "Attributes",
    MULTI_REQUESTS: "MultiRequests",
    REQUEST_DEFAULTS: "RequestDefaults",
    REQUEST_CONTEXT_1_0_IDENTIFIER: "urn:oasis:names:tc:xacml:1.0:context",
    REQUEST_CONTEXT_2_0_IDENTIFIER: "urn:oasis:names:tc:xacml:2.0:context:schema:os",
    REQUEST_CONTEXT_3_0_IDENTIFIER: "urn:oasis:names:tc:xacml:3.0:core:schema:wd-17",
    RETURN_POLICY_LIST:  "ReturnPolicyIdList",
    COMBINE_DECISION:  "CombinedDecision",
    ATTRIBUTES_CONTENT: "Content",
    RESOURCE_CONTENT: "ResourceContent",
    ATTRIBUTES_ID:  "id",
    ATTRIBUTE_ELEMENT:  "Attribute",
    ATTRIBUTES_CATEGORY:  "Category",
    ANY: "Any",
};

module.exports = XACMLConstants;
