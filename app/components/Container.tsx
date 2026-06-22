interface ContainerProps {
    children: React.ReactNode
}

const Container: React.FC<ContainerProps> = ({children}) => {
    return (
        <div
            className="
                max-w-[1414px]
                px-3 md:px-6
                lg:mx-auto
            "
        >
            {children}
        </div>
    );
};

export default Container;