import { FC, ReactNode, useEffect, useState } from 'react';

type AppDelayLoaderProps = {
  children: ReactNode;
};

const AppDelayLoader: FC<AppDelayLoaderProps> = ({ children }) => {
  const [shouldShowLoader, setShouldShowLoader] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShowLoader(true);
    }, 500)

    return () => {
      clearTimeout(timer);
      setShouldShowLoader(false);
    }
  }, [])

  return shouldShowLoader ? children: null
};

export default AppDelayLoader;