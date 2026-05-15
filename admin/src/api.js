import { useContext } from 'preact/hooks';
import { UserContext } from './context/UserContext.jsx';

export const API = 'http://localhost:3000/api';

export function useAuth() {
  const { currentUser } = useContext(UserContext);

  const getAuthHeader = () => {
    if (!currentUser || !currentUser.email) return {};

    return { 'Authorization': 'Bearer ' + btoa(currentUser.email) };
  };

  return { currentUser, getAuthHeader };
}