/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const TimeAttribute = require("../attr/timeAttribute");
const DateAttribute = require("../attr/dateAttribute");
const DateTimeAttribute = require("../attr/dateTimeAttribute");

const useCachedEnvValues = false;
let currentTime
let currentDate
let currentDateTime

class BasicEvaluationCtx {
  constructor() { }

  getRequestRoot () {
    return this.requestRoot;
  }

  isSearching () {
    return false;
  }

  getCurrentTime () {
    const millis = dateTimeHelper();

    if (useCachedEnvValues) {
      return currentTime;
    }
    else {
      const ta = new TimeAttribute()
      ta.timeAttributeInitDate(new Date(millis))
      return ta;
    }

  }

  getCurrentDate () {
    const millis = dateTimeHelper();
    if (useCachedEnvValues) {
      return currentDate;
    }
    else {
      const da = new DateAttribute();
      da.bullshit(new Date(millis))
      return da
    }

  }

  getCurrentDateTime () {
    const millis = dateTimeHelper();
    if (useCachedEnvValues) {
      return currentDateTime;
    }
    else {
      const dta = new DateTimeAttribute();
      dta.bullshit(new Date(millis))
      return dta
    }
  }

  getAttribute (path, type, category,
    contextSelector, xpathVersion) {
    if (this.pdpConfig.getAttributeFinder() != null) {
      return this.pdpConfig.getAttributeFinder().findAttribute(path, type, this,
        xpathVersion);
    } else {
      Console.warn("Context tried to invoke AttributeFinder but was " +
        "not configured with one");

      return new EvaluationResult(BagAttribute.createEmptyBag(type));
    }
  }
}

const dateTimeHelper = () => {
  if (currentTime != null) {
    return -1;
  }

  let time = new Date();
  const millis = time.getTime();
  if (!useCachedEnvValues) {
    return millis;
  } else {
    currentTime = new TimeAttribute(time);
    currentDate = new DateAttribute(new Date(millis));
    currentDateTime = new DateTimeAttribute(new Date(millis));
  }

  return -1;
}
module.exports = BasicEvaluationCtx;