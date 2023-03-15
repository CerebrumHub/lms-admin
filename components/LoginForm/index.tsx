'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import LoadingButton from '@mui/lab/LoadingButton';

const LoginForm = (): JSX.Element => {
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setLoading(true);
        signIn('google');
      }}
      className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16"
    >
      <LoadingButton variant="contained" size="medium" loading={loading} type="submit">
        <span>Sign In with Google</span>
      </LoadingButton>
    </form>
  );
};

export default LoginForm;
