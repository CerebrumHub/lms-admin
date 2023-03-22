'use client';

import { useState } from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import { DatePicker } from '@mui/x-date-pickers';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import toast from 'react-hot-toast';
import fileDownload from 'js-file-download';

const SquadCalendarGenerationForm = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [startDateValue, setStartDateValue] = useState<string | null>(null);
  const [calendarRequired, setCalendarRequired] = useState<boolean>(true);

  return (
    <Paper className="flex flex-col space-y-4 px-4 py-8 sm:px-16 w-1/4" elevation={12}>
      <h2>Generation of Squad calendars</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);

          const formData = new FormData();

          formData.append('startDate', e.currentTarget.startDate.value);
          formData.append('tribeNumber', e.currentTarget.tribeNumber.value);
          formData.append('projectNumber', e.currentTarget.projectNumber.value);
          formData.append('squadMembersFile', e.currentTarget.squadMembersFile.files[0]);

          if (e.currentTarget.calendarRequired.value === 'true') {
            formData.append('squadEventsFile', e.currentTarget.squadEventsFile.files[0]);
          }

          fetch('/api/calendar/generate-squad', {
            method: 'POST',
            body: formData
            // credentials: 'include'
          }).then(async (res) => {
            setLoading(false);
            if (res.status === 200) {
              const header = res.headers.get('Content-Disposition');
              const parts = header!.split(';');
              const filename = parts[1].split('=')[1];

              fileDownload(await res.blob(), filename);
            } else {
              const result = JSON.parse(await res.text());

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
            control={<Switch id="calendarRequired" defaultChecked/>}
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
