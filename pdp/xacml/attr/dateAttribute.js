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
var DateTimeAttribute = require('./dateTimeAttribute');
var AttributeValue = require('./attributeValue');
var identifier = "http://www.w3.org/2001/XMLSchema#date";
var NANOS_PER_MILLI = 1000000;
var MILLIS_PER_SECOND = 1000;
var SECONDS_PER_MINUTE = 60;
var MINUTES_PER_HOUR = 60;
var HOURS_PER_DAY = 24;
var NANOS_PER_SECOND = NANOS_PER_MILLI * MILLIS_PER_SECOND;
var MILLIS_PER_MINUTE = MILLIS_PER_SECOND * SECONDS_PER_MINUTE;
var MILLIS_PER_HOUR = MILLIS_PER_MINUTE * MINUTES_PER_HOUR;
var MILLIS_PER_DAY = MILLIS_PER_HOUR * HOURS_PER_DAY;
var TZ_UNSPECIFIED = -1000000;
var value;
var timeZone;
var defaultedTimeZone;
var encodedValue = null;
var simpleParser;

function DateAttribute() {};

util.inherits(DateAttribute, AttributeValue);
DateAttribute.prototype.dateAttributeInit = function(){
		this.attributeValueInit(identifier);
		var currDate = moment()._d;
		var currOffset = DateTimeAttribute.prototype.getDefaultTZOffset(currDate);
		var millis = moment(currDate).valueOf();
		millis += currOffset * MILLIS_PER_MINUTE;
		millis -= millis % MILLIS_PER_DAY;
		millis -= currOffset * MILLIS_PER_MINUTE;
		currDate = millis;
		init(currDate,currOffset,currOffset);
};

DateAttribute.prototype.dateAttributeInit2 = function(date,timeZone,defaultedTimeZone){
		this.attributeValueInit(identifier);
		init(date, timeZone, defaultedTimeZone);
};

function init(date,timeZone,defaultedTimeZone){
		this.value = date;
    this.timeZone = timeZone;
    this.defaultedTimeZone = defaultedTimeZone;
};
DateAttribute.prototype.getInstance = function(value){
		var dateValue;
		var timeZone;
		var defaultedTimeZone;

		if(simpleParser == null){
				initParsers();
		}
		if(value.endsWith("Z")){
				value = value.substring(0, value.length-1) + "+0000";
				dateValue = strictParse('YYYY-MM-DDZ', value);
				timeZone = 0;
        defaultedTimeZone = 0;
		}else{
				var len = value.length;
				if ((len > 6) && (value.charAt(len-3) == ':')) {
						var gmtValue = strictParse('YYYY-MM-DDZ',value.substring(0,len-6) + "+0000");
						var value = value.substring(0, len-3) +
                    value.substring(len-2, len);
            dateValue = strictParse('YYYY-MM-DDZ', value);
            timeZone =  moment(gmtValue).valueOf() - moment(dateValue).valueOf();
            timeZone = timeZone / 60000;
            defaultedTimeZone = timeZone;
				}
				else{
						dateValue = strictParse('YYYY-MM-DDZ', value);
						timeZone = TZ_UNSPECIFIED;
						var gmtValue = strictParse('YYYY-MM-DDZ', value + "+0000");
						defaultedTimeZone = moment(gmtValue).valueOf() - moment(dateValue).valueOf();
            defaultedTimeZone = defaultedTimeZone / 60000;
				}
		}
		var attr = new DateAttribute.dateAttributeInit(dateValue, timeZone,
                                               defaultedTimeZone);
		return attr;
};

DateAttribute.prototype.getInstance2 = function(root){
		 return this.getInstance(root.childNodes()[0].text());
};

function initParsers(){
		if(simpleParser != null){
				return null;
		}
		simpleParser = moment(now.format()).format('YYYY-MM-DD');
		zoneParser = moment(now.format()).format('YYYY-MM-DDZ');
};

function strictParse(parser,str){
		var ret = moment(str).format(parser);
		return ret

};

DateAttribute.prototype.MILLIS_PER_SECOND = MILLIS_PER_SECOND;
DateAttribute.prototype.MILLIS_PER_MINUTE = MILLIS_PER_MINUTE;
DateAttribute.prototype.NANOS_PER_SECOND = NANOS_PER_SECOND;
DateAttribute.prototype.NANOS_PER_MILLI = NANOS_PER_MILLI;
DateAttribute.prototype.MILLIS_PER_DAY = MILLIS_PER_DAY;


DateAttribute.prototype.identifier =  identifier;
String.prototype.endsWith = function(suffix) {
    return this.match(suffix+"$") == suffix;
};


module.exports = DateAttribute;
