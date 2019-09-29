import CodeMirror from 'codemirror';
import 'codemirror/mode/meta';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/keymap/sublime';
import 'codemirror/theme/monokai.css';
 
import React from 'react';
import { HighLightList } from '../config/nebulaQL'

interface Props {
  options: Object,
  value: string,
  ref: any,
  width?: string,
  height?: string
  onChange?:Function
};
interface IState {
}
 

export default class ReactCodeMirror extends React.Component<Props, IState> {
  codemirror;
  editor;
  textarea;
  constructor(props) {
    super(props);
  
  }
  public componentDidMount() {
    this.renderCodeMirror();
    CodeMirror.defineMode('nebula', () => {
      return {
        /**
            这个token方法就是用来标亮关键字的，
            CodeMirror会自上而下，从左往右得遍历每一个字符，依次调用token方法。
            stream参数可以用来控制遍历的粒度，比如我调用方法 stream.eatWhile(/\s/),
            那么当前cursor后面所有的空格会被匹配到stream中，stream.current()的值就是所有匹配到的空格。
        **/
        token: (stream) => {
          if (stream.eatSpace()) { return null }
          stream.eatWhile(/[\$\w\u4e00-\u9fa5]/)
          const cur = stream.current()
          const exist = HighLightList.some((item) => {
            return item === cur
          })
          if (exist) {
            return 'def'
          }
          stream.next()
        },
        blockCommentStart: "/*",
        blockCommentEnd: "*/",
        lineComment: "//" ? "#" : "--",
        closeBrackets: "()[]{}''\"\"``"
      }
    })
  }
  renderCodeMirror() {
    //参数合并
    const options = Object.assign({
      tabSize: 2,
      fontSize:28,
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      lineWrapping: true,
      // 显示行号
      lineNumbers: true,
      fullScreen: true,
    }, this.props.options)
    this.editor = CodeMirror.fromTextArea(this.textarea, options);
    // 获取CodeMirror用于获取其中的一些常量
    this.codemirror = CodeMirror;
    // 事件处理映射
    this.editor.on('change', this.codemirrorValueChange)  
    const { value, width, height } = this.props;
    // 初始化值
    this.editor.setValue(value || '');
    if (width || height) {
      // 设置尺寸
      this.editor.setSize(width, height);
    }
    
  }

  codemirrorValueChange = (doc, change) => {
    if (this.props.onChange && change.origin !== 'setValue') {
      this.props.onChange(doc.getValue(), change)
    }
  }

  async componentWillReceiveProps(nextProps) {
    const { options, width, height } = nextProps;
    await this.setOptions(options);
    this.editor.setSize(width, height);
  }

  async setOptions(options) {
    if (typeof options === 'object') {
      const mode = CodeMirror.findModeByName(options.mode);
      if (mode && mode.mode) {
        await import(`codemirror/mode/${mode.mode}/${mode.mode}.js`);
      }
      if (mode) {
        options.mode = mode.mime;
      }
      Object.keys(options).forEach((name) => {
        if (options[name] && JSON.stringify(options[name])) {
          this.editor.setOption(name, options[name]);
        }
      });
    }
  }

  componentWillUnmount() {
    if (this.editor) {
      this.editor.toTextArea();
    }
  }

  render() {
    return (
      <textarea ref={(instance) => { this.textarea = instance; }} />
    )
  }
}
