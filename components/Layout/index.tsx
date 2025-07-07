import GuidelineSidebar from "@/components/GuidelineSidebar";
import HeaderSimple from "@/components/HeaderSimple";

type Props = {
    title: string;
    children: React.ReactNode;
};

import { content } from "./content";

const Layout = ({ title, children }: Props) => (
    <div className="min-h-screen pl-55 pt-20 bg-[#FCFCFC]">
        <HeaderSimple className="fixed top-0 left-55 right-0 z-10 border-b border-[#ECECEC]" />
        <GuidelineSidebar
            className="fixed top-0 left-0 bottom-0 !w-55 !min-h-auto"
            content={content}
        />
        <div className="max-[1339px]:hidden">
            <div className="px-12 py-8 border-b border-[#ECECEC] text-[2rem] leading-[2.5rem]">
                {title}
            </div>
            {children}
        </div>
        <div className="hidden justify-center items-center h-[calc(100svh-5rem)] text-3xl max-[1339px]:flex">
            Please switch to a desktop to view this content.
        </div>
    </div>
);

export default Layout;
