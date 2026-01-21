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
const PortRange = require('./portRange');

const identifier = "urn:oasis:names:tc:xacml:2.0:data-type:dnsName";
let identifierURI;
var value;
let isSubdomain = false;

function DNSNameAttribute() { };

util.inherits(DNSNameAttribute, AttributeValue);

(function () {
  identifierURI = identifier;
})()

DNSNameAttribute.prototype.init = function (hostname) {
  const portRange = new PortRange();
  portRange.init();
  this.initWithRange(hostname, portRange);
};

DNSNameAttribute.prototype.initWithRange = function (hostname, range) {
  this.attributeValueInit(identifierURI);
  if (!this.isValidHostName(hostname)) {
    console.error("FIXME: throw error about bad hostname");
  }

  if (hostname.charAt(0) === '*') {
    this.isSubdomain = true;
  }
  this.hostname = hostname;
  this.range = range;
};

DNSNameAttribute.prototype.getInstanceWithRoot = function (root) {
  return this.getInstanceWithValue(root.childNodes[0].value());
}

DNSNameAttribute.prototype.getInstanceWithValue = function (value) {
  const portSep = value.indexOf(':');
  const dnsNameAttribute = new DNSNameAttribute();

  if (portSep === -1) {
    dnsNameAttribute.init(value);
    return dnsNameAttribute;
  } else {
    const hostname = value.substring(0, portSep);
    const range = PortRange.prototype.getInstance(value.substring(portSep + 1, value.length()));

    return dnsNameAttribute.initWithRange(hostname, range);
  }
  return anyURIAttribute;
};

DNSNameAttribute.prototype.isValidHostName = function (hostname) {
  const domainlabel = "\\w[[\\w|\\-]*\\w]?";
  const toplabel = "[a-zA-Z][[\\w|\\-]*\\w]?";
  const pattern = "[\\*\\.]?[" + domainlabel + "\\.]*" + toplabel + "\\.?";

  return hostname.matches(pattern);
};

DNSNameAttribute.prototype.encode = function () {
  if (this.range.isUnbound()) {
    return this.hostname;
  }
  return `${this.hostname}:${this.range.encode()}`;
}

DNSNameAttribute.prototype.toString = function () {
  return "DNSNameAttribute: \"" + this.encode() + "\"";
}

DNSNameAttribute.prototype.identifier = identifier;


module.exports = DNSNameAttribute;
