import './Modal.scss';

export default function Modal (props) {
    return (
        <div class="Modal">
            <div class="Modal-body">
                {props.children}
            </div>
        </div>
    );
}