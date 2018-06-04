# form-batch-validator
批量验证器

## 特性
- 批量验证表单字段
- 内置常用的验证器
- 支持自定义标签
- 支持自定义验证器
- 支持自定义错误信息
- 支持错误信息国际化

## 依赖
- [is](https://github.com/enricomarino/is/tree/982047c7013a2f460d2b5d5046133a46bf39fe95)

## 安装
```bash
npm install form-batch-validator --save
```

## 示例
```js
const Validator = require('form-batch-validator');
const validator = new Validator();

const obj = { ... };
const rules = { ... };

let res = validator.validate(rules, obj);
```

## 国际化
- 在 error_i18n 下，新建错误信息对应的语言文件
- 实例化的时候，将对应语言文件名传入对象中
- 框架本身自带两种语言(zh_cn、en_us)，默认语言为 zh_cn
```js
// touch i18n.js
const Validator = require('form-batch-validator');
const validator = new Validator({ lang: 'en_us' });
```

## 自定义标签
- 使用 label(eg:用户名) 指定待检测属性的标签，如果未定义，则使用属性名(eg:username)代替
```js
const rules = {
  usernmae: {
    label: '用户名'
    rules: { ... }
  }
}
```

## 自定义错误信息
- 使用 msg 指定待检测属性的自定义错误信息
- 在错误信息中，将使用 label 的值来替换 "${label}"，把标签带入到具体的错误中
- 内置验证器都有默认的错误信息，如果不符合开发者的需求，可以使用自定义错误信息，或配置全局的错误信息语言文件，来替换掉默认的提示
```js
const rules = {
  gender: {
    label: '性别',
    rules: [
      { type: 'required' },
      { type: 'in', rules: ['male', 'female', 'unknown'], msg: '${label}只能是男/女/未知' },
    ]
  }
}
```

## 自定义验证器
- 内置的验证器不满足需求时，允许用户自定义验证器
- addValidator，第一个参数为验证器类型(名称唯一)，在定义验证规则的时候，通过该参数指定使用的验证器
- addValidator，第二个参数为一个回调方法，在回调方法实现验证逻辑
```js 
// 自定义验证器
validator.addValidator('a', (label, rule, obj) => {
  if (obj != 'a') {
    return rule.msg ? rule.msg : '[' + label + '] ' + 'shoud be equal a'
  }
});

// 使用验证器
const rules = {
  attribute: { type: 'a' }
}
```

## 内置验证器
- [requiredValidator](#requiredvalidator)
- [stringValidator](#stringvalidator)
- [intValidator](#intvalidator)
- [numberValidator](#numbervalidator)
- [inValidator](#invalidator)
- [lengthValidator](#lengthvalidator)
- [rangeValidator](#rangevalidator)
- [regexValidator](#regexvalidator)
- [dateValidator](#datevalidator)
- [timeValidator](#timevalidator)
- [datetimeValidator](#datetimevalidator)
- [emailValidator](#emailvalidator)
- [urlValidator](#urlvalidator)
- [mobileValidator](#mobilevalidator)
- [objectValidator](#objectvalidator)
- [arrayValidator](#arrayvalidator)

### requiredValidator
- 必填验证器
- 被验证字段为空值，将返回错误
- 被验证字段未定义 required 将被视为非必填，如果字段的值为空值，我们将忽略该字段的所有验证规则
- 0、""、{}、[]、undefined、NaN、null 都将被视为空值
```js
const rules = {
  username: {
    rules: { type: 'required' }
  }
}
```

### stringValidator
- 字符串验证器，通常要配合其他的验证器
```js
const rules = {
  username: {
    rules: [
      { type: 'string' },
      { type: 'length', rules: ['~', 6, 15] }
    ]
  }
}
```

### intValidator
- 整型验证器，通常可以配合大小验证器
```js
const rules = {
  age: {
    rules: { type: 'int' }
  }
}
```

### numberValidator
- 数值验证器
```js
const rules = {
  size: {
    rules: { type: 'number' }
  }
}
```

### inValidator
- 枚举验证器
```js
const rules = {
  gender: {
    rules: { type: 'in', rules: ['male', 'female', 'unknown'] },
  }
}
```

### lengthValidator
- 长度验证器，只能配合 intValidator、stringValidator、arrayValidator 来使用，如果被验证字段不是上诉类型将抛出异常
- 必须要定义 rules 数组，rules[0]定义判断类型，rules[1]定义下限，rules[2]定义上限，rules[1]、rules[2]都是闭区间
- rules[0] 取值有 \~、>、>=、=、<、<=，\~ 表示区间
- 如果被检测字段是 int 型，它将被转换为 string 来检测长度
```js
const rules = {
  username: {
    rules: [
      { type: 'string' },
      { type: 'length', rules: ['~', 6, 15] }
    ]
  }
}
```

### rangeValidator
- 大小验证器，只能配合 numberValidator 来使用，如果被验证字段不是上诉类型将抛出异常
- 必须要定义 rules 数组，rules[0]定义判断类型，rules[1]定义下限，rules[2]定义上限，rules[1]、rules[2]都是闭区间
- rules[0] 取值有 \~、>、>=、=、<、<=，\~ 表示区间
```js
const rules = {
  size: {
    rules: [
      { type: 'number' },
      { type: 'range', rules: ['>=', 36] }
    ]
  }
}
```

### regexValidator
- 正则验证器
- 必须要定义 rules 正则
```js
const rules = {
  mobile: {
    rules: { type: 'regex', rules: /^[1][3,4,5,6,7,8,9][0-9]{9}$/ },
  }
}
```

### dateValidator
- 日期验证器，默认正则 /^\d{4}\-\d{2}\-\d{2}$/
- 如果默认的格式不符合，可以使用 rules 传入自定义正则进行校验
```js
const rules = {
  date: {
    rules: { type: 'date' }
  }
}

// 自定义正则
const rules = {
  date: {
    rules: { type: 'date', rules: /^\d{4}\-\d{1,2}\-\d{1,2}$/ }
  }
}
```

### timeValidator
- 时间验证器，默认正则 /^\d{2}:\d{2}:\d{2}$/
- 如果默认的格式不符合，可以使用 rules 传入自定义正则进行校验
```js
const rules = {
  time: {
    rules: { type: 'time' }
  }
}

// 自定义正则
const rules = {
  time: {
    rules: { type: 'time', rules: /^\d{2}:\d{2}$/ }
  }
}
```

### datetimeValidator
- 日期时间验证器，默认正则 /^\d{4}\-\d{2}\-\d{2} \d{2}:\d{2}:\d{2}$/
- 如果默认的格式不符合，可以使用 rules 传入自定义正则进行校验
```js
const rules = {
  datetime: {
    rules: { type: 'datetime' }
  }
}

// 自定义正则
const rules = {
  time: {
    rules: { type: 'datetime', rules: /^\d{4}\-\d{1,2}\-\d{1,2} \d{2}:\d{2}$/ }
  }
}
```

### emailValidator
- 邮箱验证器，默认正则 /^[a-z0-9\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+(?:\.[a-z0-9\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+)*@(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?$/i
- 如果默认的格式不符合，可以使用 rules 传入自定义正则进行校验
```js
const rules = {
  email: {
    rules: { type: 'email' }
  }
}
```

### urlValidator
- url 验证器，默认正则/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/i;
- 如果默认的格式不符合，可以使用 rules 传入自定义正则进行校验
```js
const rules = {
  url: {
    rules: { type: 'url' }
  }
}
```

### mobileValidator
- 中国大陆手机号验证器，默认正则 /^[1][3,4,5,6,7,8,9][0-9]{9}$/
- 如果默认的格式不符合，可以使用 rules 传入自定义正则进行校验
```js
const rules = {
  mobile: {
    rules: { type: 'mobile' }
  }
}
```

### objectValidator
- 纯对象验证器，支持属性的递归校验
- 如果需要属性的递归校验，可以使用 rules 传入属性的验证规则
```js
// 对象类型校验
const rules = {
  object: {
    rules: { type: 'object' }
  }
}

// 对象属性的递归校验
const rules = {
  object: {
    label: '对象'
    rules: {
      type: 'object',
      rules: {
        attr1: {
          label: '属性1',
          rules： { type： 'string' }
        },
        attr2: {
          label: '属性2'
          rules： [
            { type: 'required' },
            { type: 'object', rules: { //... } }
          ]
        }
        // ...
      }
    }
  }
}
```

### arrayValidator
- 数组验证器，支持元素校验
- 如果需要元素校验，可以使用 rules 传入元素的验证规则
```js
// 数组类型校验
const rules = {
  array: {
    rules: { type: 'array' }
  }
}

// 数组元素校验
const rules = {
  array: {
    label: '数组',
    rules: {
      type: 'array',
      rules: {
        type: 'object',
        rules: {
          attr1: {
            label: '属性1',
            rules: [ { type: 'required' }, { type: 'string'} ]
          },
          attr2: {
            label: '属性2'
            rules: { type: 'in', rules: [1, 2, 3]}
          }
        }
      }
    }
  }
}
```
