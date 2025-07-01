import { useState } from "react";
import Search from "./Search";
import NewFolder from "./NewFolder";
import Folder from "./Folder";

import { folders } from "./folders";

const Folders = () => {
    const [search, setSearch] = useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log(search);
    };

    return (
        <div className="w-58 p-2 rounded-[1.25rem] bg-[#FCFCFC] border border-[#ECECEC] shadow-[0px_239px_67px_0px_rgba(0,0,0,0.00),0px_153px_61px_0px_rgba(0,0,0,0.01),0px_86px_52px_0px_rgba(0,0,0,0.04),0px_38px_38px_0px_rgba(0,0,0,0.06),0px_10px_21px_0px_rgba(0,0,0,0.07)]">
            <Search
                search={search}
                onChange={(e) => setSearch(e.target.value)}
                handleSubmit={handleSubmit}
            />
            <NewFolder />
            <div className="flex flex-col">
                {folders.map((folder, index) => (
                    <Folder item={folder} key={index} />
                ))}
            </div>
        </div>
    );
};

export default Folders;
