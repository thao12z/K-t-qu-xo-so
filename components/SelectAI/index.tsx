import { options } from "./options";

const SelectAI = () => {
    return (
        <div className="w-51 p-2 bg-[#FCFCFC] border border-[#E2E2E2] rounded-[1.25rem] shadow-[0px_239px_67px_0px_rgba(0,0,0,0.00),0px_153px_61px_0px_rgba(0,0,0,0.01),0px_86px_52px_0px_rgba(0,0,0,0.04),0px_38px_38px_0px_rgba(0,0,0,0.06),0px_10px_21px_0px_rgba(0,0,0,0.07)]">
            {options.map((option) => (
                <button
                    className="w-full px-3 py-2.5 text-left rounded-xl leading-[1rem] font-medium cursor-pointer transition-colors hover:bg-[#F1F1F1]"
                    key={option.id}
                >
                    <div className="text-[0.8125rem]">{option.title}</div>
                    <div className="mt-1 text-[0.6875rem] text-[#7B7B7B]/70">
                        {option.description}
                    </div>
                </button>
            ))}
        </div>
    );
};

export default SelectAI;
