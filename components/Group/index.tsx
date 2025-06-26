type Props = {
    title?: string;
    children: React.ReactNode;
};

const Group = ({ title, children }: Props) => (
    <div className="p-12 border-b border-[#ECECEC] last:border-b-0">
        {title && (
            <div className="mb-5 text-[1.25rem] leading-[1.75] font-medium">
                {title}
            </div>
        )}
        {children}
    </div>
);

export default Group;
