import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import formidable from 'formidable';
import { DateTime, Info } from 'luxon';

import fs from 'fs';

import { parse } from 'csv-parse';
import { google } from 'googleapis';

interface EventData {
  weekNumber: string;
  dayWeek: string;
  summary: string;
  description: string;
  colorId: string;
  startDateWithTime?: string;
  endDateWithTime?: string;
  timeZone: string;
  isMeetRequired: 'No' | 'Yes';
}

export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req, secret: process.env.SECRET });

  if (!token) {
    res.status(401);
    res.end();

    return;
  }

  const form = formidable({});

  const formData = new Promise((resolve, reject) => {
    form.parse(req, async (err: any, fields: any, files: any) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({ fields, files });
    });
  });

  try {
    const data: any = await formData;
    const tribeMembersParsing: Promise<Array<string>> = new Promise((resolve, reject) => {
      const tribeMembers: Array<string> = [];

      fs.createReadStream(data.files.tribeMembersFile.filepath)
      .pipe(parse({
        delimiter: ',',
        from_line: 2
      }))
      .on('data', (row: Array<string>) => {
        tribeMembers.push(row[0]);
      })
      .on('error', reject)
      .on('end', () => resolve(tribeMembers));
    });
    const eventsParsing: Promise<Array<EventData>> = new Promise((resolve, reject) => {
      const events: Array<EventData> = [];

      fs.createReadStream(data.files.listOfEventsFile.filepath)
      .pipe(parse({
        delimiter: ';',
        from_line: 2,
        columns: ['weekNumber', 'dayWeek', 'summary', 'description', 'colorId', 'startDateWithTime', 'endDateWithTime', 'timeZone', 'isMeetRequired']
      }))
      .on('data', (row: EventData) => {
        events.push(row);
      })
      .on('error', reject)
      .on('end', () => resolve(events));
    });

    const tribeMembers: Array<string> = await tribeMembersParsing;
    const events: Array<EventData> = await eventsParsing;
    const tribeNumber: string = data.fields.tribeNumber;
    const startDate: string = data.fields.startDate;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ID,
      process.env.GOOGLE_SECRET
    );

    oauth2Client.setCredentials({
      refresh_token: token!.refresh_token as string,
      expiry_date: token!.expiry_date as number,
      access_token: token!.access_token as string,
      token_type: token!.token_type as string,
      id_token: token!.id_token as string,
      scope: token!.scope as string
    });

    const admin = google.admin({ version: 'directory_v1', auth: oauth2Client });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const groupList = await admin.groups.list({ customer: 'my_customer' });
    const isTribeExist = Array.isArray(groupList.data.groups) && groupList.data.groups.some((group: any) => {
      const existingTribeNumber: string = group.email.toLowerCase().replace('qa_tribe_', '').replace('@cerebrumhub.com', '');

      return existingTribeNumber === tribeNumber;
    });

    if (isTribeExist) {
      res.status(500).send({ message: 'The tribe with this number already exists. Please use a different tribe number' });
      res.end();

      return;
    }

    const newGroup = await admin.groups.insert({
      requestBody: {
        email: `qa_tribe_${tribeNumber}@cerebrumhub.com`,
        name: `QA Tribe ${tribeNumber}`
      }
    });

    await Promise.all(tribeMembers.map((memberEmail) => admin.members.insert({
      groupKey: newGroup.data.id as string,
      requestBody: {
        email: memberEmail,
        role: 'MEMBER'
      }
    })));

    const newCalendar = await calendar.calendars.insert({
      requestBody: {
        summary: `QA Tribe ${tribeNumber} Calendar`,
        timeZone: 'Europe/Tallinn'
      }
    });

    await calendar.acl.insert({
      calendarId: newCalendar.data.id as string,
      sendNotifications: true,
      requestBody: {
        role: 'reader',
        scope: {
          type: 'group',
          value: 'email of the group'
        }
      }
    });

    await Promise.all(events.map((event) => {
      const formattedStartDate: DateTime = DateTime.fromFormat(startDate, 'dd.MM.yyyy').setZone(event.timeZone);
      const startDateInCorrespondingWeek: DateTime = formattedStartDate.plus({ week: Number(event.weekNumber) });
      const resultDate: DateTime = startDateInCorrespondingWeek.plus({ day: Info.weekdays().findIndex(value => value === event.dayWeek) });
      const resultStartDateWithTime: DateTime = event.startDateWithTime
        ? resultDate.plus({
          hour: Number(DateTime.fromISO(event.startDateWithTime).toFormat('HH')),
          minute: Number(DateTime.fromISO(event.startDateWithTime).toFormat('mm'))
        })
        : resultDate;
      const resultEndDateWithTime: DateTime = event.endDateWithTime
        ? resultDate.plus({
          hour: Number(DateTime.fromISO(event.endDateWithTime).toFormat('HH')),
          minute: Number(DateTime.fromISO(event.endDateWithTime).toFormat('mm'))
        })
        : resultDate;

      return calendar.events.insert({
        calendarId: newCalendar.data.id as string,
        conferenceDataVersion: event.isMeetRequired.toLowerCase() === 'yes' ? 1 : 0,
        requestBody: {
          start: {
            dateTime: resultStartDateWithTime.toString(),
            timeZone: event.timeZone
          },
          end: {
            dateTime: resultEndDateWithTime.toString(),
            timeZone: event.timeZone
          },
          attendees: [
            {
              email: newGroup.data.email
            }],
          summary: event.summary,
          conferenceData: {
            createRequest: {
              conferenceSolutionKey: {
                type: 'hangoutsMeet'
              },
              requestId: event.summary
            }
          },
          colorId: event.colorId,
          description: event.description
        }
      });
    }));


    res
    .status(200)
    .send({ message: `New group email address: ${newGroup.data.email}. Calendar ID: ${newCalendar.data.id}` });
  } catch (error) {
    res.status(500).send({ message: error?.toString() || 'Something went wrong' });
  }

  res.end();
}
