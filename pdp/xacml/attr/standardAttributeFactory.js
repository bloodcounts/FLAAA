/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const util = require("util");

const BaseAttributeFactory = require('./baseAttributeFactory');
const StringAttribute = require("./stringAttribute");
const BooleanAttribute = require("./booleanAttribute");
const IntegerAttribute = require("./integerAttribute");
const DoubleAttribute = require("./doubleAttribute");
const DateAttribute = require("./dateAttribute");
const TimeAttribute = require("./timeAttribute");
const DateTimeAttribute = require("./dateTimeAttribute");
const DayTimeDurationAttribute = require("./dayTimeDurationAttribute");
const YearMonthDurationAttribute = require("./yearMonthDurationAttribute");
const AnyURIAttribute = require("./anyURIAttribute");
const X500NameAttribute = require("./x500NameAttribute");
const RFC822NameAttribute = require("./rfc822NameAttribute");
const HexBinaryAttribute = require("./hexBinaryAttribute");
const Base64BinaryAttribute = require("./base64BinaryAttribute");
const DNSNameAttribute = require("./dnsNameAttribute");
const IPAddressAttribute = require("./ipAddressAttribute");
const XPathAttribute = require("../xacml3/xPathAttribute");

const BooleanAttributeProxy = require('../attrProxy/booleanAttributeProxy');
const StringAttributeProxy = require('../attrProxy/stringAttributeProxy');
const DateAttributeProxy = require('../attrProxy/dateAttributeProxy');
const TimeAttributeProxy = require('../attrProxy/timeAttributeProxy');
const DateTimeAttributeProxy = require('../attrProxy/dateTimeAttributeProxy');
const DayTimeDurationAttributeProxy = require('../attrProxy/dayTimeDurationAttributeProxy');
const YearMonthDurationAttributeProxy = require('../attrProxy/yearMonthDurationAttributeProxy');
const DoubleAttributeProxy = require('../attrProxy/doubleAttributeProxy');
const IntegerAttributeProxy = require('../attrProxy/integerAttributeProxy');
const AnyURIAttributeProxy = require('../attrProxy/anyURIAttributeProxy');
const HexBinaryAttributeProxy = require('../attrProxy/hexBinaryAttributeProxy');
const Base64BinaryAttributeProxy = require('../attrProxy/base64BinaryAttributeProxy');
const X500NameAttributeProxy = require('../attrProxy/x500NameAttributeProxy');
const RFC822NameAttributeProxy = require('../attrProxy/rfc822NameAttributeProxy');
const DNSNameAttributeProxy = require('../attrProxy/dnsNameAttributeProxy');
const IPAddressAttributeProxy = require('../attrProxy/ipAddressAttributeProxy');
const XPathAttributeProxy = require('../xacml3/xPathAttributeProxy');

const XACMLConstants = require('../XACMLConstants');

function StandardAttributeFactory() { }

util.inherits(StandardAttributeFactory, BaseAttributeFactory);

StandardAttributeFactory.prototype.standardAttributeFactoryInit = function () {
  this.baseAttributeFactoryInit(this.supportedDatatypes);
};

const initDataTypesArr = () => {
  const supportedDatatypes = {};
  const supportedV1Identifiers = [];
  const supportedV2Identifiers = [];
  const supportedV3Identifiers = [];

  supportedDatatypes[BooleanAttribute.prototype.identifier] = new BooleanAttributeProxy();
  supportedDatatypes[StringAttribute.prototype.identifier] = new StringAttributeProxy();
  supportedDatatypes[DateAttribute.prototype.identifier] = new DateAttributeProxy();
  supportedDatatypes[TimeAttribute.prototype.identifier] = new TimeAttributeProxy();
  supportedDatatypes[DateTimeAttribute.prototype.identifier] = new DateTimeAttributeProxy();
  supportedDatatypes[DayTimeDurationAttribute.prototype.identifier] = new DayTimeDurationAttributeProxy();
  //The the actual implementation of following attributes have not been completed
  supportedDatatypes[YearMonthDurationAttribute.prototype.identifier] = new YearMonthDurationAttributeProxy();
  supportedDatatypes[DoubleAttribute.prototype.identifier] = new DoubleAttributeProxy();
  supportedDatatypes[IntegerAttribute.prototype.identifier] = new IntegerAttributeProxy();
  supportedDatatypes[AnyURIAttribute.prototype.identifier] = new AnyURIAttributeProxy();
  supportedDatatypes[HexBinaryAttribute.prototype.identifier] = new HexBinaryAttributeProxy();
  supportedDatatypes[Base64BinaryAttribute.prototype.identifier] = new Base64BinaryAttributeProxy();
  supportedDatatypes[X500NameAttribute.prototype.identifier] = new X500NameAttributeProxy();
  supportedDatatypes[RFC822NameAttribute.prototype.identifier] = new RFC822NameAttributeProxy();
  Array.prototype.push.apply(supportedV1Identifiers, Object.keys(supportedDatatypes));

  //2.0
  supportedDatatypes[DNSNameAttribute.prototype.identifier] = new DNSNameAttributeProxy();
  supportedDatatypes[IPAddressAttribute.prototype.identifier] = new IPAddressAttributeProxy();
  Array.prototype.push.apply(supportedV2Identifiers, Object.keys(supportedDatatypes));

  //3.0
  supportedDatatypes[XPathAttribute.prototype.identifier] = new XPathAttributeProxy();
  Array.prototype.push.apply(supportedV3Identifiers, Object.keys(supportedDatatypes));

  return {
    supportedDatatypes,
    supportedV1Identifiers,
    supportedV2Identifiers,
    supportedV3Identifiers
  }
}

StandardAttributeFactory.prototype.getFactory = function () {
  if (!this.factoryInstance) {
    const initDataTypes = initDataTypesArr();
    this.supportedDatatypes = initDataTypes.supportedDatatypes;
    this.supportedV1Identifiers = initDataTypes.supportedV1Identifiers;
    this.supportedV2Identifiers = initDataTypes.supportedV2Identifiers;
    this.supportedV3Identifiers = initDataTypes.supportedV3Identifiers;

    this.factoryInstance = new StandardAttributeFactory();
    this.factoryInstance.standardAttributeFactoryInit();
  }
  return this.factoryInstance;
};

StandardAttributeFactory.prototype.getStandardDatatypes = function (xacmlVersion) {
  if (xacmlVersion === XACMLConstants.XACML_1_0_IDENTIFIER) {
    return this.supportedV1Identifiers;
  } else if (xacmlVersion === XACMLConstants.XACML_2_0_IDENTIFIER) {
    return this.supportedV2Identifiers;
  } else if (xacmlVersion === XACMLConstants.XACML_3_0_IDENTIFIER) {
    return this.supportedV3Identifiers;
  }

  throw new Error("Unknown XACML version: ", xacmlVersion);
}

module.exports = StandardAttributeFactory;
