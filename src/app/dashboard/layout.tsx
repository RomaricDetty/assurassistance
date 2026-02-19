import {AppSidebar} from "@/components/layout/app-sidebar";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {Header} from "@/components/layout/header";
import {Metadata} from "next";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const metadata: Metadata = {
    title: "Dashboard Marchand - MonPote",
    description: "Dashboard Marchand - MonPote",
};

export default function Page({children}: DashboardLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset>
                <Header/>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
