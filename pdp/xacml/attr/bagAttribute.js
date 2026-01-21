/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var AttributeValue = require('./attributeValue');

function BagAttribute(type, bag) {
  this.attributeValueInit(type);
  if (type === null) {
    console.log("Bags require a non-null " + "type be provided");
  }
  if (bag === null || bag.length === 0) {
    this.bag = [];
  } else {
    for (let i = 0, l = bag.length; i < l; i++) {
      const attr = bag[i];

      if (attr.isBag()) {
        console.error('bags cannot contain other bags');
      }

      if (type !== attr.getType()) {
        console.error('Bag items must all be of the same type');
      }
    }
    this.bag = bag;
  }

};
util.inherits(BagAttribute, AttributeValue);

BagAttribute.prototype.size = function () {
  return this.bag.length;
};
BagAttribute.prototype.getBag = function () {
  return this.bag[0];
};
BagAttribute.prototype.createEmptyBag = function (type) {
  var bagAttribute = new BagAttribute(type, null);
  return bagAttribute;
}

BagAttribute.prototype.isEmpty = function () {
  return this.bag.length === 0
}
module.exports = BagAttribute;
