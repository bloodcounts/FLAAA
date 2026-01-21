'use strict';

let instance;
const BloomFilter = require('./utils/bloomFilter');

class PolicyFilter {

  constructor(isEnabled) {
    instance = this;
    this.bloomFilters = {};
    this.isEnabled = isEnabled;
  }

  static getInstance(isEnabled = false) {
    if (instance) {
      return instance;
    } else {
      return new PolicyFilter(isEnabled);
    }
  }

  addPolicySetAttrs(policySet) {
    if (!this.isEnabled) return;
    const policySetBloomFilter = new BloomFilter(
      32 * 256,
      16
    );
    const targetCategories = [];
    policySet.target.anyOfSelections.forEach(target => {
      let category = null;
      target.allOfSelections.forEach(allSelection => {
        allSelection.matches.forEach(match => {
          if (!category) {
            category = match.evals.category;
            targetCategories.push(category);
          }
          const attrString = `${match.evals.id}:${match.attrValue.value}`;
          policySetBloomFilter.add(attrString);
        });
      });
    });
    this.bloomFilters[policySet.idAttr] = {
      policySetBloomFilter,
      category: targetCategories
    }

    policySet.children.forEach(policy => {
      const categories = [];
      const policyBloomFilter = new BloomFilter(
        32 * 256,
        16
      );
      policy.target.anyOfSelections.forEach(anyOfSelection => {
        let category = null;
        anyOfSelection.allOfSelections.forEach(allSelection => {
          allSelection.matches.forEach(match => {
            if (!category) {
              category = match.evals.category;
              categories.push(category);
            }
            const attrString = `${match.evals.id}:${match.attrValue.value}`;
            policyBloomFilter.add(attrString)
          });
        });
      });
      this.bloomFilters[policy.idAttr] = {
        categories,
        policyBloomFilter
      }
    });
  }

  setPolicySetId(id) {
    this.policySetId = id;
  }

  checkExist(policyId, attributeSet) {
    if (!this.isEnabled) return true;
    const filteredCategories = this.bloomFilters[policyId].categories;
    const bloomFilter = this.bloomFilters[policyId].policyBloomFilter;

    for (let i = 0; i < attributeSet.length; i++) {
      const isCategoryIncluded = filteredCategories.indexOf(attributeSet[i].category);
      if (isCategoryIncluded === -1 ) {
        continue;
      }
      const subAttribute = attributeSet[i].attributes;
      const subAttributesSize = subAttribute.length;
      let falseIndex = 0;
      for (let j = 0; j < subAttributesSize; j++) {
        const attr = subAttribute[j];
        if (bloomFilter.test(`${attr.id}:${attr.getValue().value}`)) {
          break;
        } else {
          falseIndex++;
        }
      }
      if (falseIndex > 0 && falseIndex === subAttributesSize) {
        return false
      }
    }
  
    return true;
  }
}

module.exports = PolicyFilter
