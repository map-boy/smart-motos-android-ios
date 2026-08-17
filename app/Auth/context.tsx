import React from 'react';

interface AuthContextType {
  user: any;
  setUser: (user: any) => void;
}

const AuthContext = React.createContext<AuthContextType>({
  user: null,
  setUser: () => {},
});

export default AuthContext;
