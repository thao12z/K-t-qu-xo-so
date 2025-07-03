import { useState } from "react";
import ReactSlider from "react-slider";

const Isometric = () => {
    const [range, setRange] = useState(0.283);

    return (
        <div className="px-1">
            <div className="mb-2 text-[0.75rem] font-medium">Distortion</div>
            <div className="flex gap-1">
                <ReactSlider
                    className="grow"
                    thumbClassName="h-9 w-6 bg-[#f8f7f7] rounded-md shadow-[0_-1px_4px_-2px_rgba(0,0,0,0.20)_inset,0px_0px_2.6px_-1px_rgba(0,0,0,0.17),0px_1px_4px_0px_rgba(0,0,0,0.14)]"
                    trackClassName="h-9 bg-[#7b7b7b]/30 rounded-lg"
                    min={0}
                    max={1}
                    step={0.001}
                    value={range}
                    onChange={setRange}
                    renderTrack={(props, state) => {
                        const { key, ...restProps } = props;
                        return (
                            <div
                                key={key}
                                {...restProps}
                                className={`${props.className} ${
                                    state.index === 1
                                        ? "bg-[#f1f1f1]"
                                        : "bg-[#7b7b7b]/30"
                                }`}
                            />
                        );
                    }}
                />
                <div className="flex justify-center items-center gap-1.5 shrink-0 w-19.5 h-9 pr-1 bg-[#f1f1f1] rounded-[0.625rem] text-[0.75rem] font-medium">
                    <svg
                        className="size-4 fill-[#7b7b7b]/70"
                        width={20}
                        height={20}
                        viewBox="0 0 20 20"
                    >
                        <path d="M3.818 5.789a.93.93 0 0 1 1.348 0c.372.386.372 1.011 0 1.397L3.403 9.011h13.193l-1.762-1.825c-.338-.351-.369-.899-.092-1.286l.092-.111a.93.93 0 0 1 1.348 0l2.791 2.891c.703.729.703 1.91 0 2.639l-2.79 2.891a.93.93 0 0 1-1.348 0c-.372-.386-.372-1.011 0-1.397l1.762-1.827H3.403l1.763 1.827c.338.351.369.899.092 1.286l-.092.111a.93.93 0 0 1-1.348 0l-2.79-2.891c-.703-.729-.703-1.91 0-2.639l2.79-2.891z" />
                    </svg>
                    {range}
                </div>
            </div>
        </div>
    );
};

export default Isometric;
