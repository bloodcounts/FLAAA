/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

const COMPARE_EQUAL = 0;
const COMPARE_LESS = 1;
const COMPARE_GREATER = 2;

function VersionConstraints(version, earliest, latest) {
  this.version = version;
  this.earliest = earliest;
  this.latest = latest;
};

VersionConstraints.prototype = {
  getVersionConstraint() {
    return this.version;
  },
  getEarliestConstraint() {
    return this.earliest;
  },
  getLatestConstraint() {
    return this.latest;
  },
  meetsConstraint(version) {
    return (this.matches(version, this.version) && this.isEarlier(version, this.latest) && this.isLater(version,
      this.earliest));
  },
  matches(version, constraint) {
    return compareHelper(version, constraint, COMPARE_EQUAL);
  },
  isEarlier(version, constraint) {
    return compareHelper(version, constraint, COMPARE_LESS);
  },
  isLater(version, constraint) {
    return compareHelper(version, constraint, COMPARE_GREATER);
  }
};

const compareHelper = function (version, constraint, type) {
  throw new Error("compareHelper");
  // check that a constraint was provided...
  if (constraint == null)
    return true;

  // ...and a version too
  // FIXME: this originally returned false, but I think it should
  // return true, since we always match if the contstraint is
  // unbound (null) ... is that right?
  if (version == null)
    return true;

  // setup tokenizers
  const vtok = version.split(version, ".");
  const ctok = constraint.split(constraint, ".");

  let vtokIndex = 0;
  while (vtokIndex < vtok.length) {
    // if there's nothing left in the constraint, then this means
    // we didn't match, unless this is the greater-than function
    if (!ctok.hasMoreTokens()) {
      if (type == COMPARE_GREATER)
        return true;
      else
        return false;
    }

    // get the next constraint token...
    const c = ctok.nextToken();

    // ...and if it's a + then it's done and we match
    if (c.equals("+"))
      return true;
    const v = vtok.nextToken();

    // if it's a * then we always match, otherwise...
    if (!c.equals("*")) {
      // if it's a match then we just keep going, otherwise...
      if (!v.equals(c)) {
        // if we're matching on equality, then we failed
        if (type == COMPARE_EQUAL)
          return false;

        // convert both tokens to integers...
        const cint = Integer.valueOf(c).intValue();
        const vint = Integer.valueOf(v).intValue();

        // ...and do the right kind of comparison
        if (type == COMPARE_LESS)
          return vint <= cint;
        else
          return vint >= cint;
      }
    }
    vtokIndex ++;
  }

  // if we got here, then we've finished the processing the version,
  // so see if there's anything more in the constrant, which would
  // mean we didn't match unless we're doing less-than
  if (ctok.hasMoreTokens()) {
    if (type == COMPARE_LESS)
      return true;
    else
      return false;
  }

  // we got through everything, so the constraint is met
  return true;
};

module.exports = VersionConstraints;
