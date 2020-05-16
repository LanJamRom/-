module.exports = {
  root: true,
  env: {
    browser: true,
    node: true
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  extends: [
    '@nuxtjs',
    'prettier',
    'prettier/vue',
    'plugin:prettier/recommended',
    'plugin:nuxt/recommended'
  ],
  plugins: [
    'prettier'
  ],
  // add your custom rules here
  rules: {
    "prettier/prettier": "warn",
    'nuxt/no-cjs-in-config': 'off',
    "spaced-comment": "error", // 注释前面必须有空格
    "no-console": "off",
    "no-undef": "off",
    // 组件的name属性总是PascalCase命名
    "vue/name-property-casing": ["warn", "PascalCase"],
    // 声明prop的时候始终使用camelCase而在模板和JSX始终使用kebab-case
    "vue/prop-name-casing": ["warn", "camelCase"],
    // prop要尽量详细
    "vue/require-prop-types": "warn",
    // v-for要设置键值以高效更新虚拟DOM
    "vue/require-v-for-key": "warn",
    // 不要把v-if v-for放在同一个元素上，v-for优先级更高
    "vue/no-use-v-if-with-v-for": "warn",
    // 多个特性的元素应该分多行撰写，每个特性一行
    "vue/max-attributes-per-line": [
      "warn",
      {
        "singleline": 10,
        "multiline": {
          "max": 1,
          "allowFirstLine": false
        }
      }
    ],
    // 指令缩写 (用 : 表示 v-bind: 和用 @ 表示 v-on:) 应该要么都用要么都不用
    "vue/v-bind-style": ["warn", "shorthand"],
    "vue/v-on-style": ["warn", "shorthand"],
    // 无重复键
    "vue/no-dupe-keys": "warn",
    // 组件传值时无重复属性
    "vue/no-duplicate-attributes": [
      "warn",
      {
        "allowCoexistClass": true,
        "allowCoexistStyle": true
      }
    ],
    // 不适用保留关键字
    "vue/no-reserved-keys": "warn",
    // 计算属性必须返回值
    "vue/return-in-computed-property": [
      "warn",
      {
        "treatUndefinedAsUnspecified": true
      }
    ],
    // 移除无效指令以及修饰符
    "vue/valid-v-on": "warn",
    // 自定义组件传值使用kebab-case
    "vue/attribute-hyphenation": ["warn", "always"],
    //  html属性默认使用双引号
    "vue/html-quotes": ["error", "double"],
    // 自闭合很简单且很短的tempalte
    "vue/html-self-closing": [
      "warn",
      {
        "html": {
          "void": "always",
          "normal": "always",
          "component": "always"
        },
        "svg": "always",
        "math": "always"
      }
    ],
    // 表达式与大括号之间应该留有一个空格
    "vue/mustache-interpolation-spacing": ["warn", "always"],
    // template中属性不应该有空格 <div class="item"></div> error: class = "item"
    "vue/no-spaces-around-equal-signs-in-attribute": ["warn"],
    // Never use this keyword in expressions
    "vue/this-in-template": ["error", "never"],
    // 强制文件末尾保留空行
    "eol-last": 2,
    "spaced-comment": "error", // 注释前面必须有空格
    // DOM模板的组件名总是kebab-case
    "vue/component-name-in-template-casing": [
      "warn",
      "kebab-case",
      {
        "registeredComponentsOnly": false,
        "ignores": []
      }
    ],
    "vue/attributes-order": "error", //标签属性必须按规则排序
    "vue/order-in-components": "error", //组件的属性必须为一定的顺序
    // 'import/order': ["off", "never"]
  }
}
