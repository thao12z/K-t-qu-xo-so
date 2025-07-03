import GuidelineSidebar from "../GuidelineSidebar";

type Props = {
    title: string;
    children: React.ReactNode;
};

import { content } from "./content";

const Layout = ({ title, children }: Props) => (
    <div className="min-h-screen pl-55 pt-20 bg-[#FCFCFC]">
        <GuidelineSidebar
            className="fixed top-0 left-0 bottom-0 !w-55 !min-h-auto"
            content={content}
        />
        <div className="px-12 py-8 border-b border-[#ECECEC] text-[2rem] leading-[2.5rem]">
            {title}
        </div>
        {children}
    </div>
);

export default Layout;
