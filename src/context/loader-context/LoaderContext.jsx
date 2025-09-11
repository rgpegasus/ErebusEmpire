import React, { createContext, useContext, useState } from 'react';
import { Loader } from '@features/other/pages/Loader';

const LoaderContext = createContext();

export const LoaderProvider = ({ children }) => {

  const [loadingCount, setLoadingCount] = useState(0);

  const setLoading = (isLoading) => {
    setLoadingCount(count => {
      return isLoading ? count + 1 : Math.max(count - 1, 0);
    });
  };

  return (
    <LoaderContext.Provider value={{ setLoading, loading: loadingCount > 0 }}>
      {children}
      {loadingCount > 0 && <Loader />}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);