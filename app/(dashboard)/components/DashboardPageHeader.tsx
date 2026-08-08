import type {ReactNode} from "react";

type Props = {
    title: string;
    description: string;
    actions?: ReactNode;
};

const DashboardPageHeader = ({title, description, actions}: Props) => (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 md:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">{description}</p>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
    </div>
);

export default DashboardPageHeader;
