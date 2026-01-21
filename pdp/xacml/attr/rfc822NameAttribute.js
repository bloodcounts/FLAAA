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
var identifier = "urn:oasis:names:tc:xacml:1.0:data-type:rfc822Name";

function RFC822NameAttribute() {};
util.inherits(RFC822NameAttribute, AttributeValue);

RFC822NameAttribute.prototype.rFC822NameAttributeInit = function(value){
		this.attributeValueInit(identifier);
    
		var parts = value.split("@");
		if (parts.length != 2) {
      	console.log("invalid RFC822Name: " + value);
    }
    this.value = parts[0] + "@" + parts[1].toLowerCase();
};

RFC822NameAttribute.prototype.getInstance2 = function(value){
 
    var rFC822NameAttribute = new RFC822NameAttribute();
    
    rFC822NameAttribute.rFC822NameAttributeInit(value.toString())
		return rFC822NameAttribute;
};

RFC822NameAttribute.prototype.getInstance = function(root){
 		//console.log(root.childNodes()[0].toString())
		return this.getInstance2(root.childNodes()[0]);

};
RFC822NameAttribute.prototype.getValue = function(){
		return this.value;
};

RFC822NameAttribute.prototype.identifier = identifier;

module.exports = RFC822NameAttribute;
