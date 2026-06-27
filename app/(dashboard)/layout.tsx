import Navbar from "@/app/components/Navbar";
import Container from "@/app/components/Container";
import ToasterProvider from "@/app/Providers/ToasterProvider";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <ToasterProvider/>
            <Container>
                {children}
            </Container>
            <div className="mt-10 lg:mt-20">
            </div>
        </>
    );
}