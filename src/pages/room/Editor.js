import { useEffect, useRef } from 'preact/hooks';
import './Editor.scss';

export default function Editor (props) {
    let el = useRef();

    useEffect(() => {   
        if (!window.__editors) {
            window.__editors = {};
        }

        window.__editors[props.mode] = CodeMirror.fromTextArea(el.current, {
            lineNumbers: true,
            mode: props.mode === 'html'? 'xml' : props.mode,
            indentUnit: 4,
            indentWithTabs: true,
            tabSize: 4,
            readOnly: props.readonly
        });
    }, []);

    useEffect(() => {
        function onBeforeChange (editor, changes) {
            if (changes[0].origin !== 'setValue') {
                window.__editors[props.mode].__prevCursor = window.__editors[props.mode].getCursor();
                props.onChange(props.mode, changes);
            }
        }

        window.__editors[props.mode].on('changes', onBeforeChange);

        return () => {
            window.__editors[props.mode].off('changes', onBeforeChange);
        };
    }, [props.onChange]);

    useEffect(() => {
        window.__editors[props.mode].setOption('readOnly', props.readonly);
    }, [props.readonly]);

    return (
        <div class="Editor">
            <textarea ref={el} />
        </div>
    )
}