import Invite from "@/components/Invite";
import Button from "@/components/Button";
import GeneralAccess from "./GeneralAccess";
import Person from "./Person";
import Foot from "./Foot";

import { people } from "./people";

const ShareFile = () => {
    return (
        <div className="w-105 rounded-[2rem] border border-[#ECECEC] bg-[#FCFCFC] shadow-[0px_239px_67px_0px_rgba(0,0,0,0.00),_0px_153px_61px_0px_rgba(0,0,0,0.01),_0px_86px_52px_0px_rgba(0,0,0,0.04),_0px_38px_38px_0px_rgba(0,0,0,0.06),_0px_10px_21px_0px_rgba(0,0,0,0.07)]">
            <div className="flex gap-1.5 p-4">
                <Invite className="grow" />
                <Button isSecondary>Invite</Button>
            </div>
            <GeneralAccess />
            <div className="py-2.5 border-t border-[#ECECEC]">
                <div className="px-4 py-2 text-[0.6875rem] leading-[1rem] font-medium text-[#7B7B7B]/70">
                    People with access
                </div>
                <div className="">
                    {people.map((person) => (
                        <Person
                            name={person.name}
                            email={person.email}
                            avatar={person.avatar}
                            accessPerson={person.accessPerson}
                            key={person.id}
                            isRemoveButton
                        />
                    ))}
                    <Person
                        name="Hellen"
                        email="helen@ui8.net"
                        avatar="/images/avatars/1.png"
                        accessPerson="owner"
                    />
                </div>
            </div>
            <Foot />
        </div>
    );
};

export default ShareFile;
