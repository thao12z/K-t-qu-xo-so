import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Props = {
    className?: string;
    content: {
        id: number;
        title: string;
        items: {
            id: number;
            title: string;
            iconPath: string;
            href: string;
        }[];
    }[];
};

const Sidebar = ({ className, content }: Props) => {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href;

    return (
        <div
            className={`flex flex-col w-60 min-h-219 bg-[#FCFCFC] border-r border-[#ECECEC] ${
                className || ""
            }`}
        >
            <div className="p-6">
                <Link href="/">
                    <Image
                        className="opacity-100"
                        src="/images/logo.svg"
                        width={145}
                        height={32}
                        alt="Logo"
                    />
                </Link>
            </div>
            <div className="grow px-5 pb-5 overflow-y-auto scrollbar-none">
                {content.map((group) => (
                    <div className="mb-3 last:mb-0" key={group.id}>
                        <div className="mb-0.5 p-2.5 text-[0.75rem] leading-[1rem] font-medium text-[#7b7b7b]/70">
                            {group.title}
                        </div>
                        <div className="flex flex-col gap-0.5">
                            {group.items.map((item) => (
                                <Link
                                    className={`group flex items-center gap-3 p-1 rounded-xl text-[0.75rem] leading-[1rem] font-semibold text-[#121212] transition-colors hover:bg-[#F1F1F1] ${
                                        isActive(item.href)
                                            ? "bg-[#F1F1F1]"
                                            : ""
                                    }`}
                                    key={item.id}
                                    href={item.href}
                                >
                                    <div
                                        className={`flex items-center justify-center size-8 rounded-lg transition-colors ${
                                            isActive(item.href)
                                                ? "bg-[#FCFCFC] shadow-[0px_0px_4px_0px_rgba(18,18,18,0.10)]"
                                                : ""
                                        }`}
                                    >
                                        <svg
                                            className={`size-5 fill-[#7B7B7B] transition-colors group-hover:fill-[#121212] ${
                                                isActive(item.href)
                                                    ? "fill-[#121212]"
                                                    : ""
                                            }`}
                                            width={20}
                                            height={20}
                                            viewBox="0 0 20 20"
                                        >
                                            <path d={item.iconPath} />
                                        </svg>
                                    </div>
                                    {item.title}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
