/**
 * ESLint 配置文件
 * 用于 Hexo 博客项目的 JavaScript 质量检查
 */

module.exports = {
  env: {
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // 禁止未使用的变量
    'no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    // 强制使用严格相等
    eqeqeq: ['error', 'always'],
    // 禁止使用 console（开发时允许）
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    // 强制使用分号
    semi: ['error', 'always'],
    // 强制使用单引号
    quotes: ['error', 'single', { avoidEscape: true }],
    // 强制缩进2空格
    indent: ['error', 2, { SwitchCase: 1 }],
    // 强制行尾有分号
    'no-unreachable': 'error',
    // 禁止多余空格
    'no-trailing-spaces': 'warn',
    // 强制大括号风格
    'brace-style': ['error', '1tbs'],
    // 强制使用 const
    'prefer-const': 'warn',
    // 禁止使用 var
    'no-var': 'error'
  }
};
