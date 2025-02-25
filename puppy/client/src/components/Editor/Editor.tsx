import React, { useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as monacoEditor from 'monaco-editor';
import './Editor.css';
import { Puppy } from '../../vm/vm';

import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

import { CodeEditor } from '../../modules/editor';

monacoEditor.editor.defineTheme('error', {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffb7b7',
  },
});

const zenkaku =
  '[！　”＃＄％＆’（）＊＋，－．／：；＜＝＞？＠［＼￥］＾＿‘｛｜｝～￣' +
  'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ' +
  'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ' +
  '１２３４５６７８９０' +
  '｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾉﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ]';

type EditorFooterProps = {
  setFontSize: (fontSize: number) => void;
  fontSize: number;
};

const EditorFooter: React.FC<EditorFooterProps> = (
  props: EditorFooterProps
) => {
  const fontPlus = () => {
    props.setFontSize(props.fontSize + 3);
  };
  const fontMinus = () => {
    props.setFontSize(Math.max(12, props.fontSize - 3));
  };
  return (
    <div id="editor-footer">
      <Button onClick={fontPlus}>
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <Button onClick={fontMinus}>
        <FontAwesomeIcon icon={faMinus} />
      </Button>
    </div>
  );
};

export type EditorProps = {
  width: number;
  height: number;
  codeEditor: CodeEditor | null;
  decoration: string[];
  fontSize: number;
  theme: string;
  code: string;
  puppy: Puppy | null;
  coursePath: string;
  page: number;
  setCode: (code: string) => void;
  setSize: (width: number, height: number) => void;
  setCodeEditor: (codeEditor: CodeEditor | null) => void;
  setDecoration: (decoration: string[]) => void;
  setFontSize: (fontSize: number) => void;
  setDiffStartLineNumber: (startLineNumber: number) => void;
  trancepile: (puppy: Puppy | null, code: string, alwaysRun: boolean) => void;
};

let resizeTimer: NodeJS.Timeout;
let editorTimer: NodeJS.Timeout | null;

const Editor: React.FC<EditorProps> = (props: EditorProps) => {
  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize: props.fontSize,
    wordWrap: 'on' as 'on',
  };

  addEventListener('resize', () => {
    clearTimeout(resizeTimer!);
    resizeTimer = setTimeout(function() {
      props.setSize(
        document.getElementById('right-col')!.clientWidth,
        document.getElementById('right-col')!.clientHeight
      );
    }, 300);
  });

  useEffect(() => {
    props.setSize(
      document.getElementById('right-col')!.clientWidth,
      document.getElementById('right-col')!.clientHeight
    );
  }, []);

  const checkZenkaku = (codeEditor: CodeEditor) => {
    const zenkakuRanges = codeEditor
      .getModel()!
      .findMatches(zenkaku, true, true, false, null, false);
    const decos: monacoEditor.editor.IModelDeltaDecoration[] = zenkakuRanges.map(
      (match: monacoEditor.editor.FindMatch) => ({
        range: match.range,
        options: { inlineClassName: 'zenkakuClass' },
      })
    );
    props.setDecoration(codeEditor.deltaDecorations(props.decoration, decos));
  };

  const codeOnChange = (new_code: string) => {
    props.setCode(new_code);
    if (props.codeEditor) {
      checkZenkaku(props.codeEditor);
    }
    if (editorTimer) {
      clearTimeout(editorTimer);
      editorTimer = null;
    }
    editorTimer = setTimeout(() => {
      props.trancepile(props.puppy, new_code, false);
      window.sessionStorage.setItem(
        `/api/sample/${props.coursePath}/${props.page}`,
        new_code
      );
    }, 1000);
  };

  const editorDidMount = (editor: CodeEditor) => {
    editor.onDidChangeModelContent(e => {
      let startNumber = null as number | null;
      e.changes.map(change => {
        if (change.text !== '' && change.text !== '\n') {
          // ignore whitespace and enter
          startNumber =
            startNumber === null
              ? change.range.startLineNumber
              : Math.min(startNumber, change.range.startLineNumber);
        }
      });
      if (startNumber !== null) {
        props.setDiffStartLineNumber(startNumber);
      }
    });
    props.setCodeEditor(editor);
  };

  return (
    <div id="puppy-editor">
      <MonacoEditor
        width={props.width}
        height={props.height}
        language="python"
        theme={props.theme}
        value={props.code}
        options={editorOptions}
        onChange={codeOnChange}
        editorDidMount={editorDidMount}
      />
      <EditorFooter setFontSize={props.setFontSize} fontSize={props.fontSize} />
    </div>
  );
};

export default Editor;
