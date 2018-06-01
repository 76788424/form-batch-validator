const is = require('is');

class Validator {
  
  constructor(options) {
    this.options = options || {};
    if (!is.object(this.options)) { throw new TypeError('need object type options'); }
    const lang = this.options.lang ? this.options.lang : 'zh_cn';
    this.error = require('./error_i18n/' + lang);
  }
  
  genMessage(label, rule) {
    let msg = rule.msg ? rule.msg : this.error[rule.type];
    // 如果没有自定义错误信息，并且错误语言文件中也没有，返回未知错误
    if (!msg) { return 'unknown errors'; }    
    return msg.replace('${label}', '<' + label + '>');
  }
  
  /**
   * 自定义验证器
   *
   * 定义，validator.addValidator(type, (label, rule, val) => { // validate logic });
   * 使用，{ type: 'type', ... }
   *
   * @param {string} type 验证器类型
   * @param {Function} validator 验证器函数
   *   @Function Validator(label, rule, val)
   *     @param {string} label 验证对象的标签，如果没有定义，将使用属性名
   *     @param {object} rule 规则对象
   *     @param {Mixed} val 验证对象
   *     @return {string}
   *
   */
  addValidator(type, validator) {
    if (!type) { throw new TypeError('type required') }
    if (typeof validator !== 'function') { throw new TypeError('validator must be function'); }
    Validator.validators[type] = validator;
  }
  
  /**
   * 验证
   * 
   * const rules = {
   *   username: { 
   *     label: '用户名',
   *     rules: [ 
   *       { type: 'required' },
   *       { type: 'string' },
   *       { type: 'length', rules: ['~', 6, 15], msg: '用户名长度为 6-15 位' }
   *     ] 
   *   },
   *   // more attributes ...
   * }
   *   
   * @param {object} rules 验证规则
   * @param {object} obj 验证对象
   * @return {Mixed} 验证通过返回 undefined，验证未通过返回 object
   *
   */
  validate(rules, obj) {
    
    if (!is.object(rules)) { throw new TypeError('need object type rules'); }
    if (!is.object(obj)) { throw new TypeError('need object type obj'); }
    
    let errors = [];
    for (let key in rules) {
      let _rules = rules[key].rules; // 规则
      let label = rules[key].label ? rules[key].label : key; // 标签
      //多条验证规则
      if (is.array(_rules)) {
        for (let rKey in _rules) {
          let msg = this._validate(label, key, _rules[rKey], obj);
          if (is.string(msg)) {
            errors.push({ code: 'invalid', field: key, message: msg });
          }
          if (is.array(msg)) {
            for (let m in msg) {
              errors.push({ code: 'invalid', field: key + '.' + msg[m].field, message: msg[m].message }); 
            }
          }
        }
      }
      //单条验证规则
      if (is.object(_rules)) {
        let msg = this._validate(label, key,  _rules, obj);
        if (is.string(msg)) {
          errors.push({ code: 'invalid', field: key, message: msg });
        }
        if (is.array(msg)) {
          for (let m in msg) {
            errors.push({ code: 'invalid', field: key + '.' + msg[m].field, message: msg[m].message }); 
          }
        }
      }  
    }
    
    if (errors.length) { return errors; }
  }
  
  _validate(label, key, rule, obj) {
    let validator = Validator.validators[rule.type];
    if (!validator) { throw new TypeError('rule type must be in [' + Object.keys(Validator.validators).join(', ') + ']'); }
    return validator.call(this, label, rule, obj[key]);
  }
  
}

Validator.validators = {
  in: inValidator,
  length: lengthValidator,
  range: rangeValidator,
  string: stringValidator,
  required: requiredValidator,
  object: objectValidator,
  array: arrayValidator,
  int: intValidator,
  number: numberValidator,
  regex: regexValidator,
  date: dateValidator,
  time: timeValidator,
  datetime: datetimeValidator,
  email: emailValidator,
  url: urlValidator,
  mobile: mobileValidator
};

/**
 * array - 数组/数组元素验证器
 *
 * @tips 如果定义了 rules，则会对数组的每个元素进行相应的验证
 * @tips 如果每个元素有多条验证规则可以定义成对象数组，否则定义成对象，每个对象代表一条验证规则
 * 
 * {
 *   type: 'array',
 *   rules: [
 *     { type: 'string' },
 *     { type: 'length', rules: ['~', 6, 12] }
 *   ]
 * }
 *
 * { type: 'array' } 纯数组验证
 * 
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function arrayValidator(label, rule, val) {
  if (!is.array(val)) { return this.genMessage(label, rule); }
  // 元素遍历验证
  if (rule.rules) {
    let errors = [];
    for (let key in val) {
      let _label = label + '[' + key + ']';
      // 多条验证规则
      if (is.array(rule.rules)) { 
        for (let rKey in rule.rules) {
          let msg = this._validate(_label, key, rule.rules[rKey], val);
          if (is.string(msg)) {
            errors.push({ code: 'invalid', field: key, message: msg });
          }
          if (is.array(msg)) {
            for (let m in msg) {
              errors.push({ code: 'invalid', field: key + '.' + msg[m].field, message: msg[m].message }); 
            }
          }
        }
      }
      // 单条验证规则
      if (is.object(rule.rules)) {
        let msg = this._validate(_label, key, rule.rules, val);
        if (is.string(msg)) {
          errors.push({ code: 'invalid', field: key, message: msg });
        }
        if (is.array(msg)) {
          for (let m in msg) {
            errors.push({ code: 'invalid', field: key + '.' + msg[m].field, message: msg[m].message }); 
          }
        }
      }
    }
    
    if (errors.length) { return errors; }
  }
}

/**
 * object - 对象/对象属性验证器
 *
 * @tips 如果定义了 rules，则会对对象的每个属性进行相应的验证
 * 
 * { type: 'object',
 *   rules: {
 *     a: {
 *       label: '商品a', 
 *       rules: { type: 'string' }
 *     },
 *     b: {
 *       label: '商品b',
 *       rules: { type: 'in', rules: [1, 2, 3] }
 *     }
 *   }
 * }
 *
 * { type: 'object' } 纯对象验证
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function objectValidator(label, rule, val) {
  if (!is.object(val)) { return this.genMessage(label, rule); }
  // 属性递归验证
  if (rule.rules) {
    return this.validate(rule.rules, val);
  }
}

/**
 * length - 长度验证器
 *
 * @tips 该验证器只能验证 int、string、array 型数据，否则抛出异常
 * @tips 必须要定义 rules，rules 是一个数组，rules[0]定义判断类型，rules[1]定义下限，rules[2]定义上限
 *
 * { type: 'length', rules: ['~', 6, 12] }，val 长度在 6~12 位间，包括 6 和 12
 * { type: 'length', rules: ['>', 6] }，val 长度大于 6
 * 
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val 只能验证整型、字符型、数组类型数据
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function lengthValidator(label, rule, val) {
  if (!is.array(rule.rules)) { throw new TypeError('need array type rules'); }
  if (!rule.rules[1]) { throw new TypeError('missing arguments rules[1]'); }
  if (!is.integer(rule.rules[1])) { throw new TypeError('rules[1] should be an integer'); }
  
  let len = 0;
  if (is.integer(val)) { 
    len = val.toString().length;
  } else if (is.string(val) || is.array(val)) {
    len = val.length;
  } else {
    throw new TypeError('lengthValidator only can validate int, string, array type val');
  }
  
  switch (rule.rules[0]) {
    case '~':
      if (!rule.rules[2]) { throw new TypeError('missing arguments rules[2]'); }
      if (!is.integer(rule.rules[2])) { throw new TypeError('rules[2] should be an integer'); }
      if (rule.rules[1] > rule.rules[2]) { throw new TypeError('rules[1] should be an <= rules[2]'); }
      if (len < rule.rules[1] || len > rule.rules[2]) { return this.genMessage(label, rule); }
      break;
    case '=':
      if (len != rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    case '>':
      if (len <= rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    case '>=':
      if (len < rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    case '<':
      if (len >= rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    case '<=':
      if (len > rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    default:
      throw new TypeError('rules[0] should be one of ~, =, >, >=, <, <=');
  }
}

/**
 * range - 大小范围验证器
 *
 * @tips 该验证器只能验证 number 型数据，否则抛出异常
 * @tips 必须要定义 rules，rules 是一个数组，rules[0]定义比较类型，rules[1]定义下限，rules[2]定义上限
 *
 * { type: 'range', rules: ['~', 6, 12] }，val 大小在 6~12 位间，包括 6 和 12
 * { type: 'range', rules: ['>', 6] }，val 大于 6
 * 
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val 只能验证数值型数据
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function rangeValidator(label, rule, val) {
  if (!is.array(rule.rules)) { throw new TypeError('need array type rules'); }
  if (!rule.rules[1]) { throw new TypeError('missing arguments rules[1]'); }
  if (!is.integer(rule.rules[1])) { throw new TypeError('rules[1] should be an integer'); }
  
  if (!is.number(val)) {
    throw new TypeError('rangeValidator only can validate number type val');
  }
  
  switch (rule.rules[0]) {
    case '~':
      if (!rule.rules[2]) { throw new TypeError('missing arguments rules[2]'); }
      if (!is.integer(rule.rules[2])) { throw new TypeError('rules[2] should be an integer'); }
      if (rule.rules[1] > rule.rules[2]) { throw new TypeError('rules[1] should be an <= rules[2]'); }
      if (val < rule.rules[1] || val > rule.rules[2]) { return this.genMessage(label, rule); }
      break;
    case '=':
      if (val != rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    case '>':
      if (val <= rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    case '>=':
      if (val < rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    case '<':
      if (val >= rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    case '<=':
      if (val > rule.rules[1]) { return this.genMessage(label, rule); }
      break;
    default:
      throw new TypeError('rules[0] should be one of ~, =, >, >=, <, <=');
  }
}

/**
 * mobile - mobile 验证器
 *
 * @tips 中国大陆手机号
 *
 * { type: 'url验证器', rules: /.../ }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function mobileValidator(label, rule, val) {
  // 默认的手机号正则
  let regex = /^[1][3,4,5,6,7,8,9][0-9]{9}$/;
  if (is.regexp(rule.rules)) { regex = rule.rules; } // 自定义正则
  if (!regex.test(val)) { return this.genMessage(label, rule); }
}

/**
 * url - url 验证器
 *
 * { type: 'url验证器', rules: /.../ }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function urlValidator(label, rule, val) {
  // 默认的 url 正则
  let regex = /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i;
  if (is.regexp(rule.rules)) { regex = rule.rules; } // 自定义正则
  if (!regex.test(val)) { return this.genMessage(label, rule); }
}

/**
 * email - 邮箱验证器
 *
 * { type: 'email', rules: /.../ }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function emailValidator(label, rule, val) {
  // 默认的邮件正则
  let regex = /^[a-z0-9\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+(?:\.[a-z0-9\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+)*@(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?$/i;
  if (is.regexp(rule.rules)) { regex = rule.rules; } // 自定义正则
  if (!regex.test(val)) { return this.genMessage(label, rule); }
}

/**
 * date - 日期验证器
 *
 * @tips 只验证格式，不验证逻辑
 *
 * { type: 'date', rules: /.../ }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function dateValidator(label, rule, val) {
  let regex = /^\d{4}\-\d{2}\-\d{2}$/; // 默认的日期正则
  if (is.regexp(rule.rules)) { regex = rule.rules; }  // 自定义正则
  if (!regex.test(val)) { return this.genMessage(label, rule); }
}

/**
 * time - 时间验证器
 *
 * @tips 只验证格式，不验证逻辑
 *
 * { type: 'time', rules: /.../ }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function timeValidator(label, rule, val) {
  let regex = /^\d{2}:\d{2}:\d{2}$/; // 默认的时间正则
  if (is.regexp(rule.rules)) { regex = rule.rules; }  // 自定义正则
  if (!regex.test(val)) { return this.genMessage(label, rule); }
}

/**
 * datetime - 日期时间验证器
 *
 * @tips 只验证格式，不验证逻辑
 *
 * { type: 'datetime', rules: /.../ }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function datetimeValidator(label, rule, val) {
  let regex = /^\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}:\d{2}$/; // 默认的日期时间正则
  if (is.regexp(rule.rules)) { regex = rule.rules; }  // 自定义正则
  if (!regex.test(val)) { return this.genMessage(label, rule); }
}

/**
 * regex - 正则验证器
 *
 * { type: 'regex', rules: /.../ }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function regexValidator(label, rule, val) {
  if (!is.regexp(rule.rules)) { throw new TypeError('need regexp type rules'); }
  if (!rule.rules.test(val)) { return this.genMessage(label, rule); }
}

/**
 * number - 数值验证器
 *
 * { type: 'number' }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function numberValidator(label, rule, val) {
  if (!is.number(val)) { return this.genMessage(label, rule); }
}

/**
 * int - 整型验证器
 *
 * { type: 'int' }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function intValidator(label, rule, val) {
  if (!is.integer(val)) { return this.genMessage(label, rule); }
}

/**
 * string - 字符串验证器
 *
 * { type: 'string' }
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function stringValidator(label, rule, val) {
  if (!is.string(val)) { return this.genMessage(label, rule); }
}

/**
 * required - 非空验证器
 *
 * @tips 0、""、{}、[]、undefined、NaN、null 都将被视为空
 *
 * { type: 'required' }
 * 
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function requiredValidator(label, rule, val) {
  if (is.empty(val)) { return this.genMessage(label, rule); }
}

/**
 * in - 枚举验证器
 *
 * { type: 'in', rules: [1, 2, 3] }，val 必须在 rules 中
 *
 * @param {string} label
 * @param {Object} rule
 * @param {Mixed} val
 * @return {Mixed} 验证通过返回 undefined，验证未通过返回 string
 *
 */
function inValidator(label, rule, val) {
  if (!is.array(rule.rules)) { throw new TypeError('need array type rules'); }
  // 注意，使用 indexOf 并不能判断 NaN，NaN.indexOf([NaN]) === -1
  if (rule.rules.indexOf(val) === -1) { return this.genMessage(label, rule); }
}

module.exports = Validator;