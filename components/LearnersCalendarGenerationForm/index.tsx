'use client';

import { useState } from 'react';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

const LearnersCalendarGenerationForm = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [startDateValue, setStartDateValue] = useState<string | null>(null);

  const router = useRouter();

  return (
    <Paper className="flex flex-col space-y-4 px-4 py-8 sm:px-16 w-1/4" elevation={12}>
      <h2>Generation of the learner’s calendar</h2>
      <form
        onSubmit={(e) => {
          console.log(e.currentTarget)
          // e.preventDefault();
          // setLoading(true);
          // if (type === 'login') {
          //   signIn('credentials', {
          //     redirect: false,
          //     email: e.currentTarget.email.value,
          //     password: e.currentTarget.password.value
          //     // @ts-ignore
          //   }).then(({ ok, error }) => {
          //     setLoading(false);
          //     if (ok) {
          //       router.push('/calendar');
          //     } else {
          //       toast.error(error);
          //     }
          //   });
          // } else {
          //   fetch('/api/auth/register', {
          //     method: 'POST',
          //     headers: {
          //       'Content-Type': 'application/json'
          //     },
          //     body: JSON.stringify({
          //       email: e.currentTarget.email.value,
          //       password: e.currentTarget.password.value
          //     })
          //   }).then(async (res) => {
          //     setLoading(false);
          //     if (res.status === 200) {
          //       toast.success('Account created! Redirecting to login...');
          //       setTimeout(() => {
          //         router.push('/login');
          //       }, 2000);
          //     } else {
          //       toast.error(await res.text());
          //     }
          //   });
          // }
        }}
      >
        <Stack spacing={4}>
          <DatePicker
            inputFormat="dd.MM.yyyy"
            value={startDateValue}
            onChange={setStartDateValue}
            renderInput={(params) => <TextField
              {...params}
              label="Start date"
              helperText="The start date must be Monday"
              variant="outlined"
              id="startDate"
              type="date"
              InputLabelProps={{
                shrink: true
              }}
              required
              fullWidth
            />}
            shouldDisableDate={date => date.toFormat('cccc') !== 'Monday'}
            disablePast
          />


          <TextField
            label="Tribe number"
            variant="outlined"
            id="tribeNumber"
            type="number"
            InputLabelProps={{
              shrink: true
            }}
            required
            fullWidth
          />

          <TextField
            label="Tribe members"
            variant="outlined"
            id="tribeMembersFile"
            type="file"
            InputProps={{
              inputProps: { accept: '.csv' }
            }}
            InputLabelProps={{
              shrink: true
            }}
            required
            fullWidth
          />

          <TextField
            label="List of events"
            variant="outlined"
            id="listOfEventsFile"
            type="file"
            InputProps={{
              inputProps: { accept: '.csv' }
            }}
            InputLabelProps={{
              shrink: true
            }}
            required
            fullWidth
          />

          <LoadingButton variant="contained" size="large" loading={loading} type="submit">
            Start generation
          </LoadingButton>
        </Stack>

      </form>
    </Paper>
  );
};

export default LearnersCalendarGenerationForm;
