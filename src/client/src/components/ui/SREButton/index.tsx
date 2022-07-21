import './SREButton.css';

type SREButtonProps = {
  color: "blue" | "red" | "yellow" | "pink" | "gray" | "giro" | "tour" | "vuelta" | "classics";
  content?: any;
  disabled?: boolean;
  onClick: () => any;
}

const SREButton = (props: SREButtonProps) => {
  return (
    <button
      className={getButtonClass(props)}
      disabled={props.disabled ?? false}
      onClick={props.onClick}
    >
      {props.content}
    </button>
  )
}

function getButtonClass(props: SREButtonProps) {
  let classString = 'button_standard ' + props.color;
  if (props.disabled) {
    classString += ' disabled'
  }
  return classString;
}

export default SREButton