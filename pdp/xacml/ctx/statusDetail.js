/*Copyright (c), Fan Zhang
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of WIT nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.*/
"use strict";

function StatusDetail() { };

StatusDetail.prototype.initWithMissingAttribute = function (missingAttributeDetails) {
	this.missingAttributeDetails = missingAttributeDetails;
	this.detailText = "<StatusDetail>\n";

	for (let attribute of missingAttributeDetails) {
		this.detailText += attribute.getEncoded() + "\n";
	}
	this.detailText += "</StatusDetail>";
};
StatusDetail.prototype.initWithEncodedString = function (encoded) {
	this.detailText = "<StatusDetail>\n" + encoded + "\n</StatusDetail>";
}

StatusDetail.prototype.initWithRoot = function (root) {
	this.detailText = nodeToText(root);
}

const nodeToText = (root) => {
	return root.toString({XML_SAVE_NO_DECL: true, XML_SAVE_WSNONSIG: true});
}

StatusDetail.prototype.getInstance = function (root) {
	if (root.name() !== "StatusDetail") {
		throw new Error("not a StatusDetail node")
	}

	return (new StatusDetail()).initWithRoot(root);
}

StatusDetail.prototype.getMissingAttributeDetails = function () {
	return this.missingAttributeDetails;
}

StatusDetail.prototype.getEncoded = function () {
	if (this.detailText == null) {
		console.log("no encoded form available");
	}
	return this.detailText
};


module.exports = StatusDetail;
