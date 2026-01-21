/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

var AttributeValue = require('./attributeValue');
var util = require("util");
var moment = require('moment');
var { DOMParser } = require('@xmldom/xmldom');
var identifier = "http://www.w3.org/TR/2002/WD-xquery-operators-20020816#" +
    "dayTimeDuration";
var patternString = 
    "(\\-)?P((\\d+)?D)?(T((\\d+)?H)?((\\d+)?M)?((\\d+)?(.(\\d+)?)?S)?)?";
var GROUP_SIGN = 1;
var GROUP_DAYS = 3;
var GROUP_HOURS = 6;
var GROUP_MINUTES = 8;
var GROUP_SECONDS = 10;
var GROUP_NANOSECONDS = 12;
var pattern;
var negative;
var days,hours,minutes,seconds,nanoseconds,totalMillis,encodedValue,identifierURI;

valueInit();
function valueInit(){
    identifierURI = identifier;
}

function DayTimeDurationAttribute() {};
util.inherits(DayTimeDurationAttribute, AttributeValue);

DayTimeDurationAttribute.prototype.dayTimeDurationAttributeInit = function(negative, days, hours,
minutes,seconds, nanoseconds){
        this.negative = negative;
    this.days = days;
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;

    if ((days > Number.MAX_VALUE) || (hours > Number.MAX_VALUE) ||
        (minutes > Number.MAX_VALUE) || (seconds > Number.MAX_VALUE)) {
        //Todo

    }
};

DayTimeDurationAttribute.prototype.getInstance = function(value){
        var negative = false;
        var days = 0;
        var hours = 0;
        var minutes = 0;
        var seconds = 0;
        var nanoseconds = 0;

         if (pattern == null) {
                    pattern = new RegExp(patternString);
         }
         var matcher = pattern.exec(value);
         var matches = pattern.test(value);
         if (!matches) {
      console.log("Syntax error in dayTimeDuration");
     }
     if (matcher[GROUP_SIGN] != -1){
        negative = true;
     }
     days = parseGroup(matcher, GROUP_DAYS);
     hours = parseGroup(matcher, GROUP_HOURS);
     minutes = parseGroup(matcher, GROUP_MINUTES);
     seconds = parseGroup(matcher, GROUP_SECONDS);
     if (matcher[GROUP_NANOSECONDS] != -1) {  
        var nanosecondString = matcher.substring(matcher[GROUP_NANOSECONDS], m[GROUP_NANOSECONDS]);
        while (nanosecondString.length() < 9){
                nanosecondString += "0";
        }
        if (nanosecondString.length() > 9) {
        nanosecondString = nanosecondString.substring(0, 9);
    }
    nanoseconds = nanosecondString;
     }   
      if (value.charAt(value.length-1) == 'T')
        console.log("'T' must be absent if all" +
                       "time items are absent");
      return new DayTimeDurationAttribute.dayTimeDurationAttributeInit(negative, days, hours, minutes,
                        seconds, nanoseconds);
};

DayTimeDurationAttribute.prototype.getInstance2 = function(root){
        return this.getInstance(root.childNodes[0].textContent);
};
function parseGroup(matcher,groupNumber){
        var groupLong = 0;
        if (matcher[groupNumber] != -1) {
    var groupString = matcher.substring(matcher[groupNumber], m[groupNumber]);
    groupLong = groupString;
    }
    return groupLong;
};

DayTimeDurationAttribute.prototype.identifier = identifier;


module.exports = DayTimeDurationAttribute;
