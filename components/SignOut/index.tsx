'use client';
import { signOut } from 'next-auth/react';
import Button from '@mui/material/Button';

const SignOut = (): JSX.Element => {
  return (
    <Button variant="text" onClick={() => signOut()}>Sign out</Button>
  );
};

export default SignOut;
