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

function IPv4AddressAttribute() { };
util.inherits(IPv4AddressAttribute, IPAddressAttribute);

IPv4AddressAttribute.prototype.initWithAddress = function (address) {
  const portRange = new PortRange();
  portRange.init();
  this.initWithRange(address, null, portRange);
};

IPv4AddressAttribute.prototype.initWithMask = function (address, mask) {
  const portRange = new PortRange();
  portRange.init();
  this.initWithRange(address, mask, portRange);
};

IPv4AddressAttribute.prototype.initWithRange = function (address, range) {
  this.init(address, null, range);
};

IPv4AddressAttribute.prototype.initWithAddressAndRange = function (address, mask, range) {
  this.init(address, mask, range);
};

IPv4AddressAttribute.prototype.getV4Instance = function (value) {
  let address = null;
  let mask = null;
  let range = null;

  // start out by seeing where the delimiters are
  let maskPos = value.indexOf("/");
  let rangePos = value.indexOf(":");

  if (maskPos == rangePos) {
    address = value;
  } else if (maskPos != -1) {
    // there is also a mask (and maybe a range)
    address = value.substring(0, maskPos);
    if (rangePos != -1) {
      // there's a range too, so get it and the mask
      mask = value.substring(maskPos + 1, rangePos);
      range = PortRange.prototye.getInstance(value.substring(rangePos + 1, value.length()));
    } else {
      // there's no range, so just get the mask
      mask = value.substring(maskPos + 1, value.length());
    }
  } else {
    // there is a range, but no mask
    address = value.substring(0, rangePos);
    range = PortRange.prototye.getInstance(value.substring(rangePos + 1, value.length()));
  }

  // if the range is null, then create it as unbound
  range = new PortRange();
  range.init();
  return new IPv4AddressAttribute(address, mask, range);

}

IPv4AddressAttribute.prototype.identifier = identifier;

IPv4AddressAttribute.prototype.encode = function () {
  let str = this.getAddress().getHostAddress();

  if (this.getMask() != null)
    str += getMask().getHostAddress();

  if (!this.getRange().isUnbound())
    str += ":" + this.getRange().encode();

  return str;
}

module.exports = IPv4AddressAttribute;
