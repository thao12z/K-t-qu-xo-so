type Props = {
    className?: string;
    title?: string;
    span?: 1 | 2 | 3 | 4 | 5 | 6;
    center?: boolean;
    children: React.ReactNode;
};

const Card = ({ className, title, span = 1, center, children }: Props) => (
    <div
        className={`relative mt-2 mx-1 border border-[#ECECEC] ${
            span > 3 ? "rounded-[1.375rem]" : "rounded-2xl"
        } ${
            span === 2
                ? "w-[calc(50%-0.5rem)]"
                : span === 3
                ? "w-[calc(33.333%-0.5rem)]"
                : span === 4
                ? "w-[calc(25%-0.5rem)]"
                : span === 5
                ? "w-[calc(20%-0.5rem)]"
                : span === 6
                ? "w-[calc(16.666%-0.5rem)]"
                : "w-[calc(100%-0.5rem)]"
        } ${center ? "flex justify-center items-center" : ""} ${
            className || ""
        }`}
    >
        {title && (
            <div className="absolute top-2 left-2 px-3 py-1 rounded-xl bg-[#F1F1F1] text-[0.6875rem] leading-[1rem] font-medium">
                {title}
            </div>
        )}
        {children}
    </div>
);

export default Card;
