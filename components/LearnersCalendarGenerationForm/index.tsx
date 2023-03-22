'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';

const LearnersCalendarGenerationForm = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [startDateValue, setStartDateValue] = useState<string | null>(null);

  return (
    <Paper className="flex flex-col space-y-4 px-4 py-8 sm:px-16 w-1/4" elevation={12}>
      <h2>Generation of the learner’s calendar</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);

          const formData = new FormData();

          formData.append('startDate', e.currentTarget.startDate.value);
          formData.append('tribeNumber', e.currentTarget.tribeNumber.value);
          formData.append('tribeMembersFile', e.currentTarget.tribeMembersFile.files[0]);
          formData.append('listOfEventsFile', e.currentTarget.listOfEventsFile.files[0]);

          fetch('/api/calendar/generate-learners', {
            method: 'POST',
            body: formData
            // credentials: 'include'
          }).then(async (res) => {
            setLoading(false);

            const result = JSON.parse(await res.text());

            if (res.status === 200) {
              toast.success(result?.message);
            } else {
              toast.error(result?.message || 'Something went wrong');
            }
          });
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
