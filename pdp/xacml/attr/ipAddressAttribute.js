/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const AttributeValue = require('./attributeValue');
const util = require("util");
const identifier = "urn:oasis:names:tc:xacml:2.0:data-type:ipAddress";
let address;
let mask;
let range;

function IPAddressAttribute() { };
util.inherits(IPAddressAttribute, AttributeValue);

IPAddressAttribute.prototype.init = function (address, mask, range) {
  this.attributeValueInit(identifier);
  this.address = address;
  this.mask = mask;
  this.range = range;
};

IPAddressAttribute.prototype.getInstanceWithValue = function (value) {
  const IPv4AddressAttribute = require('./ipv4AddressAttribute');
  const IPv6AddressAttribute = require('./ipv6AddressAttribute');
  if (value.indexOf('[') == 0) {
    return IPv6AddressAttribute.prototype.getV6Instance(value);
  } else {
    return IPv4AddressAttribute.prototype.getV4Instance(value);
  }
};

IPAddressAttribute.prototype.getInstanceWithRoot = function (root) {
  return this.getInstanceWithValue(root.childNodes[0].value());
};

IPAddressAttribute.prototype.identifier = identifier;

IPAddressAttribute.prototype.getAddress = function () {
  return this.address;
}

IPAddressAttribute.prototype.getMask = function () {
  return this.mask;
}

IPAddressAttribute.prototype.getRange = function () {
  return this.range;
}

IPAddressAttribute.prototype.toString = function () {
  return "IPAddressAttribute: \"" + this.encode() + "\"";
}

module.exports = IPAddressAttribute;
