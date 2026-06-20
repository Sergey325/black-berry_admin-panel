import Navbar from "@/app/components/Navbar";
import Container from "@/app/components/Container";

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <Container>
                {children}
            </Container>
        </>
    );
}