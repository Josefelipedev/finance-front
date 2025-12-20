import { ReactNode } from 'react';
import {useAuth} from "../../context/AuthContext.tsx";
import LoadingSpinner from "../common/LoadingSpinner.tsx";

interface AuthCheckerProps {
    children: ReactNode;
}

const AuthChecker = ({ children }: AuthCheckerProps) => {
    const { isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthChecker;