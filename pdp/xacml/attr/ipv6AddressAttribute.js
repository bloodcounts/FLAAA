/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";
const IPAddressAttribute = require('./ipAddressAttribute');
const PortRange = require('./portRange');
const util = require("util");
const dns = require('dns');

function IPv6AddressAttribute() { };
util.inherits(IPv6AddressAttribute, IPAddressAttribute);

IPv6AddressAttribute.prototype.initWithAddress = function (address) {
  const portRange = new PortRange();
  portRange.init();
  this.initWithAddressAndRange(address, null, portRange);
};

IPv6AddressAttribute.prototype.initWithMask = function (address, mask) {
  const portRange = new PortRange();
  portRange.init();
  this.initWithAddressAndRange(address, mask, portRange);
};

IPv6AddressAttribute.prototype.initWithRange = function (address, range) {
  this.initWithAddressAndRange(address, null, range);
};

IPv6AddressAttribute.prototype.initWithAddressAndRange = function (address, mask, range) {
  this.init(address, mask, range);
};

IPv6AddressAttribute.prototype.getV6Instance = function (value) {
  let address = null;
  let mask = null;
  let range = null;
  let len = value.length();

  let endIndex = value.indexOf(']');
  address = value.substring(1, endIndex);
  if (endIndex != (len - 1)) {
    if (value.charAt(endIndex + 1) == '/') {
      let startIndex = endIndex + 3;
      endIndex = value.indexOf(']', startIndex);
      mask = value.substring(startIndex, endIndex);
    }

    if ((endIndex != (len - 1)) && (value.charAt(endIndex + 1) == ':')) {
      range = PortRange.prototype.getInstance(value.substring(endIndex + 2, len));
    }
  }
  range = new PortRange();
  range.init();
  const ipv6AddressAttribute = new IPv6AddressAttribute();
  ipv6AddressAttribute.initWithAddressAndRange(address, mask, range)
  return ipv6AddressAttribute;

  // dns.lookup(value.substring(1, endIndex), (err, address, family) => {
  //   console.log('address: %j family: IPv%s', address, family);
  // });
};


//Need to add DNS module to support host address conversion
IPv6AddressAttribute.prototype.encode = function() {
  let str = "[" + this.getAddress().getHostAddress() + "]";

  if (this.getMask() != null)
      str += "/[" + this.getMask().getHostAddress() + "]";

  if (!this.getRange().isUnbound())
      str += ":" + this.getRange().encode();

  return str;
}

IPv6AddressAttribute.prototype.identifier = identifier;

module.exports = IPv6AddressAttribute;
