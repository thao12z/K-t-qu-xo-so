type Props = {
    title: string;
    children: React.ReactNode;
};

const Layout = ({ title, children }: Props) => (
    <div className="min-h-screen pl-55 pt-20 bg-[#FCFCFC]">
        <div className="px-12 py-8 border-b border-[#ECECEC] text-[2rem] leading-[2.5rem]">
            {title}
        </div>
        {children}
    </div>
);

export default Layout;
