/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var util = require("util");
var moment = require('moment');
var { DOMParser } = require('@xmldom/xmldom');
var AttributeValue = require('./attributeValue');
var DateTimeAttribute = require('./dateTimeAttribute');
var DateAttribute = require('./dateAttribute');
var identifier = "http://www.w3.org/2001/XMLSchema#time";
var TZ_UNSPECIFIED = -1000000;
var nanoseconds;
var timeGMT;
var timeZone;
var defaultedTimeZone;
var value,
  identifierURI;

valueInit();

function valueInit() {
  identifierURI = identifier;
}

function TimeAttribute() {};

util.inherits(TimeAttribute, AttributeValue);

TimeAttribute.prototype.timeAttributeInitDate = function (time) {
  this.attributeValueInit(identifierURI);
  const currOffset = DateTimeAttribute.prototype.getDefaultTZOffset(time);
  this.init(time, 0, currOffset, currOffset);
};

TimeAttribute.prototype.timeAttributeInit = function () {
  this.attributeValueInit(identifierURI);
  var currDate = moment()._d;
  var currOffset = DateTimeAttribute.prototype.getDefaultTZOffset(currDate);
  this.init(currDate, 0, currOffset, currOffset);
};

TimeAttribute.prototype.timeAttributeInit2 = function (date, nanoseconds, timeZone,
  defaultedTimeZone) {
  this.attributeValueInit(identifierURI);
  if ((timeZone == TZ_UNSPECIFIED) &&
    (defaultedTimeZone == TZ_UNSPECIFIED)) {
    console.log("default timezone must be specified");
  }

  this.init(date, nanoseconds, timeZone, defaultedTimeZone);
};

TimeAttribute.prototype.init = function(date, nanoseconds, timeZone, defaultedTimeZone) {
  var tmpDate = date;
  this.nanoseconds = DateTimeAttribute.prototype.combineNanos(tmpDate, nanoseconds);
  this.timeGMT = moment(tmpDate).valueOf();
  this.timeZone = timeZone;
  this.defaultedTimeZone = defaultedTimeZone;
  if ((this.timeGMT >= DateAttribute.prototype.MILLIS_PER_DAY) || (this.timeGMT < 0)) {
    this.timeGMT = this.timeGMT % DateAttribute.prototype.MILLIS_PER_DAY;
    if (this.timeGMT < 0) {
      this.timeGMT += DateAttribute.prototype.MILLIS_PER_DAY;
    }
  }
};

TimeAttribute.prototype.getInstance = function (value) {
  value = "1970-01-01T" + value;
  var dateTime = DateTimeAttribute.prototype.getInstance(value);
  var dateValue = dateTime.value;
  var defaultedTimeZone = dateTime.defaultedTimeZone;
  if (dateTime.getTimeZone() == TZ_UNSPECIFIED) {
    var localTZ = moment.utc()._offset;
    newDefTimeZone = DateTimeAttribute.prototype.getDefaultTZOffset(new Date());
    dateValue = (dateValue - (newDefTimeZone - defaultedTimeZone) * DateAttribute.prototype.MILLIS_PER_MINUTE);
    defaultedTimeZone = newDefTimeZone;
  };

  const ta = new TimeAttribute()
  ta.timeAttributeInit2(dateValue,
    dateTime.nanoseconds,
    dateTime.timeZone,
    defaultedTimeZone);
  return ta
};

TimeAttribute.prototype.getInstance2 = function (root) {
  var doc = new DOMParser().parseFromString(root.toString(), 'text/xml');
  return this.getInstance(doc.childNodes[0].textContent);
};

TimeAttribute.prototype.identifier = identifier;

module.exports = TimeAttribute;
