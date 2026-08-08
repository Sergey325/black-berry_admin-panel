import Navbar from "@/app/components/Navbar";
import Container from "@/app/components/Container";
import ToasterProvider from "@/app/Providers/ToasterProvider";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <Navbar />
            <ToasterProvider/>
            <Container>
                {children}
            </Container>
            <div className="h-10 lg:h-16" />
        </div>
    );
}
