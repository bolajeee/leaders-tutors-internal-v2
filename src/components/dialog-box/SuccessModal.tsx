import { ReactNode } from "react";
import { Button } from "../form/Buttons";

export const SuccessModal: React.FC<{
  icon?: ReactNode;
  title?: string;
  text?: string;
  btnText?: string;
  onClose?: () => void;
  onClick?: () => void;
}> = (props) => {
  const { icon, title, text, btnText, onClose, onClick } = props;
  return (
    <div className="w-[300px] h-[300px] bg-white rounded-xl p-4 flex flex-col gap-3 justify-center items-center text-center">
      {onClose && (
        <div className="w-full flex justify-end items-end">
          <button
            onClick={props.onClose}
            className="w-[35px] h-[35px] bg-gray-300 rounded-full"
          >
            X
          </button>
        </div>
      )}
      {icon && icon}
      {title && <h3 className="font-dta-bold f">{title}</h3>}
      {text && <p className="text-[#686868] text-sm"> {text} </p>}
      {btnText && (
        <Button
          text={btnText || "Okay, Thanks"}
          onClick={onClick}
          className="px-10 w-[70%] bg-dta-500 hover:bg-dta-400"
        />
      )}
    </div>
  );
};
