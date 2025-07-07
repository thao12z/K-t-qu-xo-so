"use client";

import Layout from "@/components/Layout";
import Group from "@/components/Group";
import RowCards from "@/components/RowCards";
import Card from "@/components/Card";
import Logo from "@/components/Logo";

const TopbarPage = () => {
    return (
        <Layout title="Topbar">
            <Group>
                <RowCards>
                    <Card className="px-10 py-20" title="Symbol" center>
                        <Logo onlyIcon />
                    </Card>
                </RowCards>
            </Group>
        </Layout>
    );
};

export default TopbarPage;
