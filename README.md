# markdown-it-tex-equations

在 markdown-it 中支持 TEX 数学公式，避免数学公式的某部分被解析为 markdown。

参考 [markdown-it-katex](http://waylonflinn.github.io/markdown-it-katex/) 的代码实现。

## 快速开始

1. 安装 markdown-it 和这个插件

   ```shell
   npm install markdown-it markdown-it-tex-equations
   ```

2. 在你的代码中使用

   ```javascript
   var md = require('markdown-it')(),
       math = require('markdown-it-tex-equations');
   
   md.use(math);
   
   // double backslash is required for javascript strings, but not html input
   var result = md.render('# Math Rulez! \n  $\\sqrt{3x-1}+(1+x)^2$');
   ```

## 自定义

支持在代码块中插入 `\displaylines{}` 以让 Mathjax 3 支持公式换行。

```js
md.use(math,{inline:false,block:true});
```

以上为默认值，`inline` 表示内联公式是否开启，`block` 表示多行公式是否开启，如果使用 Mathjax 2 或者 Katex，请传入 `{inline:false,block:false}`。