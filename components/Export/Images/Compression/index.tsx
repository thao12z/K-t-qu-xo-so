import { useState } from "react";
import ReactSlider from "react-slider";

const Compression = () => {
    const [range, setRange] = useState(80);

    return (
        <div className="p-4 border-t border-[#ECECEC]">
            <div className="flex justify-between items-center mb-2">
                <div className="text-[0.75rem] leading-[1rem] font-medium">
                    Compression
                </div>
                <div className="text-[0.625rem] leading-[0.875rem] font-medium text-[#7B7B7B]/80">
                    3840px × 2160px
                </div>
            </div>
            <div className="flex gap-1.5">
                <ReactSlider
                    className="grow"
                    thumbClassName="h-9 w-6 bg-[#f8f7f7] rounded-md shadow-[0_-1px_4px_-2px_rgba(0,0,0,0.20)_inset,0px_0px_2.6px_-1px_rgba(0,0,0,0.17),0px_1px_4px_0px_rgba(0,0,0,0.14)] outline-none"
                    trackClassName="h-9 bg-[#7b7b7b]/30 rounded-lg"
                    min={1}
                    max={100}
                    step={1}
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
                <div className="flex justify-center items-center gap-1.5 shrink-0 w-18 h-9 pr-1 border border-[#e2e2e2] rounded-[0.625rem] text-[0.75rem] leading-[1rem] font-medium">
                    <svg
                        className="shrink-0 size-4 fill-[#7b7b7b]/70"
                        width={20}
                        height={20}
                        viewBox="0 0 20 20"
                    >
                        <path d="M11.858 5.789a.92.92 0 0 1 1.341 0l2.776 2.891c.699.729.699 1.91 0 2.639L13.2 14.211a.92.92 0 0 1-1.341 0 1.02 1.02 0 0 1 0-1.397l2.701-2.815-2.701-2.813a1.02 1.02 0 0 1-.092-1.286l.092-.111zm-5.058 0a.92.92 0 0 1 1.341 0 1.02 1.02 0 0 1 0 1.397L5.44 9.999l2.702 2.815a1.02 1.02 0 0 1 .092 1.286l-.092.111a.92.92 0 0 1-1.341 0l-2.776-2.891c-.7-.729-.7-1.91 0-2.639L6.8 5.789z" />
                    </svg>
                    {range}%
                </div>
            </div>
        </div>
    );
};

export default Compression;
