"use client";

import Layout from "@/components/Layout";
import Group from "@/components/Group";
import RowCards from "@/components/RowCards";
import Card from "@/components/Card";
import SceneAndAssetsSidebar from "@/components/SceneAndAssetsSidebar";
import DesignAndAnimationSidebar from "@/components/DesignAndAnimationSidebar";
import HomeSidebar from "@/components/HomeSidebar";
import GuidelineSidebar from "@/components/GuidelineSidebar";

import { content } from "./content";

const SidebarPage = () => {
    return (
        <Layout title="Sidebar">
            <Group title="Canvas Sidebar">
                <RowCards>
                    <Card
                        className="py-16 bg-[#F8F7F7]"
                        title="Scene, Assets"
                        span={2}
                        centerHorizontal
                    >
                        <SceneAndAssetsSidebar />
                    </Card>
                    <Card
                        className="py-16 bg-[#F8F7F7]"
                        title="Design, Animation"
                        span={2}
                        centerHorizontal
                    >
                        <DesignAndAnimationSidebar />
                    </Card>
                </RowCards>
            </Group>
            <Group title="Home Sidebar">
                <RowCards>
                    <Card
                        className="py-16 bg-[#F8F7F7]"
                        title="Home"
                        span={2}
                        centerHorizontal
                    >
                        <HomeSidebar />
                    </Card>
                    <Card
                        className="py-16 bg-[#F8F7F7]"
                        title="Guideline"
                        span={2}
                        centerHorizontal
                    >
                        <GuidelineSidebar content={content} />
                    </Card>
                </RowCards>
            </Group>
        </Layout>
    );
};

export default SidebarPage;
