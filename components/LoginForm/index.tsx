'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoadingButton from '@mui/lab/LoadingButton';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const LoginForm = ({ type }: { type: 'login' | 'register' }): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setLoading(true);
        if (type === 'login') {
          signIn('credentials', {
            redirect: false,
            email: e.currentTarget.email.value,
            password: e.currentTarget.password.value
            // @ts-ignore
          }).then(({ ok, error }) => {
            setLoading(false);
            if (ok) {
              router.push('/calendar');
            } else {
              toast.error(error);
            }
          });
        } else {
          fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: e.currentTarget.email.value,
              password: e.currentTarget.password.value
            })
          }).then(async (res) => {
            setLoading(false);
            if (res.status === 200) {
              toast.success('Account created! Redirecting to login...');
              setTimeout(() => {
                router.push('/login');
              }, 2000);
            } else {
              toast.error(await res.text());
            }
          });
        }
      }}
      className="flex flex-col space-y-4 bg-gray-50 px-4 py-8 sm:px-16"
    >
      <TextField
        label="Email Address"
        variant="outlined"
        id="email"
        name="email"
        type="email"
        InputLabelProps={{
          shrink: true
        }}
        required
        fullWidth
      />

      <FormControl fullWidth variant="outlined">
        <InputLabel htmlFor="password" shrink>Password</InputLabel>
        <OutlinedInput
          id="password"
          type={showPassword ? 'text' : 'password'}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(prevState => !prevState)}
                onMouseDown={handleMouseDownPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
          label="Password"
        />
      </FormControl>

      <LoadingButton variant="contained" size="medium" loading={loading} type="submit">
        <span>{type === 'login' ? 'Sign In' : 'Sign Up'}</span>
      </LoadingButton>

      {type === 'login' ? (
        <Box className="text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-gray-800">
            Sign up.
          </Link>
        </Box>
      ) : (
        <Box className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-gray-800">
            Sign in
          </Link>{' '}
          instead.
        </Box>
      )}
    </form>
  );
};

export default LoginForm;
