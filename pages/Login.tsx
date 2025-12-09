import React from 'react';
import { LoginScreen } from '../components/LoginScreen';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    // The existing LoginScreen component handles the API call internally ??
    // We need to check LoginScreen. If it calls api.login, we might need to adjust it
    // or wrap it.
    // If LoginScreen calls api.login and then calls onLogin(user), 
    // we should intercept that.

    // Ideally we modify LoginScreen to NOT call api directly, but use the passed function.
    // Or we just update AuthContext state when LoginScreen succeeds.

    const handleLoginSuccess = (user: any) => {
        // LoginScreen already called auth.login() internally.
        // We just need to navigate to dashboard.
        navigate('/', { replace: true });
    };

    return <LoginScreen onLogin={handleLoginSuccess} />;
};
