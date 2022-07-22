import './index.css';

interface SwitchButtonProps {
  action: () => {};
  value: boolean;
  labelLeft?: string;
  labelRight?: string;
}

const SwitchButton = (props: SwitchButtonProps) => {
  return (
    <div className="max-w-max">
      <label>
        <div className="flex cursor-pointer space-x-2 items-center">
          <div>{props.labelLeft}</div>
          <div className="relative w-8 h-4">
            <input className="w-0 h-0 opacity-0" type="checkbox" onClick={props.action} checked={props.value}/>
            <div className="switchButtonSlider"></div>
          </div>
          <div>{props.labelRight}</div>
        </div>
      </label>
    </div>
  );
}

export default SwitchButton;