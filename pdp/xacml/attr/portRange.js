/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

function PortRange() { };

const UNBOUND = -1;

PortRange.prototype.init = function () {
  this.initWithBound(UNBOUND, UNBOUND);
};

PortRange.prototype.initWithSinglePort = function (singlePort) {

};

PortRange.prototype.initWithBound = function (lowerBound, upperBound) {
  this.lowerBound = lowerBound;
  this.upperBound = upperBound;
};

PortRange.prototype.getInstance = function (value) {
  let lowerBound = UNBOUND;
  let upperBound = UNBOUND;

  if ((value.length === 0) || (value === "-")){
    const portRange = new PortRange();
    portRange.init();

    return portRange;
  }

  const dashPos = value.indexOf('-');

  if (dashPos === -1) {
    lowerBound = upperBound = parseInt(value);
  } else if (dashPos === 0) {
    upperBound = parseInt(value.substring(1));
  } else {
    lowerBound = Integer.parseInt(value.substring(0, dashPos));
    const len = value.length();
    if (dashPos !== (len - 1)) {
      upperBound = parseInt(value.substring(dashPos + 1, len));
    }
  }

  const portRange = new PortRange();
  portRange.initWithBound(lowerBound, upperBound);
  return portRange;
}

PortRange.prototype.getLowerBound = function () {
  return this.lowerBound;
};

PortRange.prototype.getLowerBound = function () {
  return this.upperBound;
};

PortRange.prototype.isLowerBounded = function() {
  return (this.lowerBound !== -1);
}

PortRange.prototype.isUpperBounded = function() {
  return (this.upperBound !== -1);
}

PortRange.prototype.isSinglePort = function() {
  return ((this.lowerBound == this.upperBound) && (this.lowerBound != UNBOUND));
}

PortRange.prototype.isUnbound = function() {
  return ((this.lowerBound == UNBOUND) && (this.upperBound == UNBOUND));
}

PortRange.prototype.encode = function () {
  if (this.isUnbound()) {
    return "";
  }
  if (this.isSinglePort()) {
      return this.lowerBound;
  }
  if (!this.isLowerBounded()) {
    return `-${this.upperBound}`;
  }
  if (!this.isUpperBounded()) {
    return this.upperBound;
  }

  return `${lowerBound}-${this.upperBound}`;
};

module.exports = PortRange;
