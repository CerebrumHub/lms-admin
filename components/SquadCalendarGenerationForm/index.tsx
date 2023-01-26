'use client';

import { useState } from 'react';
import { DateTime } from 'luxon';
import { useRouter } from 'next/navigation';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

const SquadCalendarGenerationForm = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [startDateValue, setStartDateValue] = useState<string | null>(null);
  const [calendarRequired, setCalendarRequired] = useState<boolean>(true);

  const router = useRouter();

  return (
    <Paper className="flex flex-col space-y-4 px-4 py-8 sm:px-16 w-1/4" elevation={12}>
      <h2>Generation of Squad calendars</h2>
      <form
        onSubmit={(e) => {
          console.log(e.currentTarget);
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
            label="Project number"
            variant="outlined"
            id="projectNumber"
            type="number"
            InputLabelProps={{
              shrink: true
            }}
            required
            fullWidth
          />

          <TextField
            label="Squad members"
            variant="outlined"
            id="squadMembersFile"
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

          <FormControlLabel
            value={calendarRequired}
            onChange={(event, checked) => setCalendarRequired(checked)}
            control={<Switch defaultChecked/>}
            label="Calendar required"
          />

          {calendarRequired ? (
            <TextField
              label="Squad events"
              variant="outlined"
              id="squadEventsFile"
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
          ) : null}

          <LoadingButton variant="contained" size="large" loading={loading} type="submit">
            Start generation
          </LoadingButton>
        </Stack>

      </form>
    </Paper>
  );
};

export default SquadCalendarGenerationForm;
