
const valitators = [
  'required',
  'string',
  'int',
  'number',
  'range',
  'in',
  'notin',
  'reg'
];

const Validator = require('../lib/validator');

const validator = new Validator({ lang: 'zh_cn' });

validator.addValidator('a', (label, rule, obj) => {
  if (obj != 'a') {
    return rule.msg ? rule.msg : '[' + label + '] ' + 'shoud be equal a'
  }
});

// 测试
const rules = {
  gender: {
    label: '性别',
    rules: { type: 'in', rules: ['male', 'female', 'unknown'] }
  },
  password: {
    label: '密码',
    rules: [
      { type: 'required' },
      { type: 'string' },
      { type: 'length', rules: ['~', 6, 12], msg: '长度必须是 6 ~ 12 位'}
    ]
  },
  isa: {
    label: 'isa',
    rules: [
      { type: 'string' },
      { type: 'a' }
    ]
  },
  pkg: {
    label: '套餐a',
    rules: {
      type: 'object',
      rules: {
        a: {
          label: '商品a', 
          rules: { type: 'string' }
        },
        b: {
          label: '商品b',
          rules: { type: 'object', rules: { b1: { label: '商品b_b1', rules: { type: 'string'} } } }
        }
      }
    }
  },
  pkgs: {
    label: '套餐包',
    rules: {
      type: 'array',
      rules: {
        type: 'object',
        rules: {
          a: {
            label: '套餐a',
            rules: { type: 'string'}
          },
          b: {
            label: '套餐b',
            rules: { type: 'in', rules: [1, 2, 3] }
          }
        }
      }
    }
  }
}

// 测试对象
const rules1 = {
  pkg: {
    label: '套餐a',
    rules: [ { type: 'required' }, {
      type: 'object',
      rules: {
        a: {
          label: '商品a', 
          rules: { type: 'string' }
        },
        b: {
          label: '商品b',
          rules: { type: 'object', rules: { b1: { label: '商品b_b1', rules: { type: 'string'} } } }
        }
      }
    } ]
  }
}

// 测试数组
const rules2 = {
  pkgs: {
    label: '套餐包',
    rules: {
      type: 'array',
      rules: {
        type: 'object',
        rules: {
          a: {
            label: '套餐a',
            rules: { type: 'string'}
          },
          b: {
            label: '套餐b',
            rules: { type: 'in', rules: [1, 2, 3] }
          }
        }
      }
    }
  }
}

// 整数
const rules3 = {
  a: {
    lable: '整数',
    rules: [ {type: 'required'}, { type: 'int' } ]
  }
}

// 数值型
const rules4 = {
  b: {
    label: '数值型',
    rules: { type: 'number' }
  }
}

// 正则
const rules5 = {
  c: {
    label: '正则',
    rules: { type: 'regex', rules: /^1[358][0-9]{9}$/ }
  }
}

// 日期
const rules6 = {
  d: {
    label: '日期',
    rules: { type: 'date', rules: /^\d{4}\-\d{1,2}\-\d{1,2}$/ }
  }
}

// 时间
const rules7 = {
  e: {
    label: '时间',
    rules: { type: 'time', ignoreEmpty: true }
  }
}

// 日期时间
const rules8 = {
  f: {
    label: '日期时间',
    rules: { type: 'datetime' }
  }
}

// email
const rules9 = {
  g: {
    label: '邮箱',
    rules: { type: 'email' }
  }
}

// url
const rules10 = {
  h: {
    label: 'url',
    rules: { type: 'url' }
  }
}

// mobile
const rules11 = {
  i: {
    label: '手机',
    rules: { type: 'mobile' }
  }
}

// range
const rules12 = {
  j: {
    label: '大小范围',
    rules: { type: 'range', rules: ['>', 6] }
  }
}

const rules13 = {
  k: {
    label: '必填',
    rules: [ { type: 'required' }, { type: 'array' } ]
  }
}

const obj = {
  gender: 'male1',
  password: 'hyb12345612312312',
  isa: 123,
  pkg: { a: 1, b: { b1: 123 } },
  pkgs: [
    { a: 'good1', b: 3 },
    { a: 'goods2', b: 4 },
  ],
  a: 123,
  b: 456.34,
  c: '159905733672',
  d: '2018-11-0',
  e: '23:15:1',
  f: '2018-06-01 15:55:01',
  g: '76788424@qq.com',
  h: 'https://www.baidu.com',
  i: 15990573367,
  j: 7,
  k: []
}

//console.log(rules);
let res = validator.validate(rules13, obj);
console.log(res);