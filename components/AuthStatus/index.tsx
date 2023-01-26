import { unstable_getServerSession } from 'next-auth/next';
import SignOut from '@/components/SignOut';

const AuthStatus = async () => {
  const session = await unstable_getServerSession();

  return session ? (
    <div style={{ backgroundColor: '#ECF7F5' }} className="absolute w-full flex justify-center items-center">
      <p className="text-stone-200 text-sm mr-1" style={{ color: '#333333' }}>
        Signed in as <b>{session.user?.email}</b>
      </p>
      <SignOut/>
    </div>
  ) : null;
};

export default AuthStatus;
