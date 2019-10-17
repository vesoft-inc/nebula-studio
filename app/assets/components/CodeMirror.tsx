import CodeMirror from 'codemirror';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/display/autorefresh';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/keymap/sublime';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/meta';
import 'codemirror/theme/monokai.css';

import React from 'react';
import { HighLightList } from '../config/nebulaQL';

interface IProps {
  options: object;
  value: string;
  ref: any;
  width?: string;
  height?: string;
  onChange?: (value: string) => void;
}

export default class ReactCodeMirror extends React.PureComponent<IProps, any> {
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
        token: (stream) => {
          if (stream.eatSpace()) {
            return null;
          }
          stream.eatWhile(/[\$\w\u4e00-\u9fa5]/);
          const cur = stream.current();
          const exist = HighLightList.some((item) => {
            return item === cur;
          });
          if (exist) {
            return 'def';
          }
          stream.next();
        },
        blockCommentStart: '/*',
        blockCommentEnd: '*/',
        lineComment: '//' ? '#' : '--',
        closeBrackets: '()[]{}\'\'""``',
      };
    });
  }
  renderCodeMirror() {
    // parameters of the combined
    const options = Object.assign(
      {
        tabSize: 2,
        fontSize: '14px',
        autoCloseBrackets: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        lineWrapping: true,
        // show number of rows
        lineNumbers: true,
        fullScreen: true,
      },
      this.props.options,
    );
    this.editor = CodeMirror.fromTextArea(this.textarea, options);
    // Getting CodeMirror is used to get some of these constants
    this.codemirror = CodeMirror;
    // event
    this.editor.on('change', this.codemirrorValueChange);
    const { value, width, height } = this.props;
    this.editor.setValue(value || '');
    if (width || height) {
      // set size
      this.editor.setSize(width, height);
    }
  }

  codemirrorValueChange = (doc, change) => {
    if (this.props.onChange && change.origin !== 'setValue') {
      this.props.onChange(doc.getValue());
    }
  }

  async componentWillReceiveProps(nextProps) {
    const { options, width, height, value } = nextProps;
    await this.setOptions(options);
    if (value !== this.editor.getValue()) {
      this.editor.setValue(value || '');
    }
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
      <textarea
        ref={(instance) => {
          this.textarea = instance;
        }}
      />
    );
  }
}
