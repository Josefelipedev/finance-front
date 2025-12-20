import { Navigate, Outlet } from 'react-router';
import {useAuth} from "../../context/AuthContext.tsx";
import LoadingSpinner from "../common/LoadingSpinner.tsx";


const PublicRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return !isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default PublicRoute;