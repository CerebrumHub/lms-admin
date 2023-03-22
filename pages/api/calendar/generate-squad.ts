import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';
import formidable from 'formidable';
import { DateTime, Info } from 'luxon';

import fs from 'fs';

import { parse } from 'csv-parse';
import { json2csv } from 'json-2-csv';
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

interface MemberData {
  squadId: string;
  email: string;
  result?: string;
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
    const squadMembersParsing: Promise<Array<MemberData>> = new Promise((resolve, reject) => {
      const squadMembers: Array<MemberData> = [];

      fs.createReadStream(data.files.squadMembersFile.filepath)
      .pipe(parse({
        delimiter: ';',
        from_line: 2,
        columns: ['squadId', 'email']
      }))
      .on('data', (row: MemberData) => {
        squadMembers.push(row);
      })
      .on('error', reject)
      .on('end', () => resolve(squadMembers));
    });

    const eventsParsing: Promise<Array<EventData>> = new Promise((resolve, reject) => {
      const events: Array<EventData> = [];

      if (!data.files.squadEventsFile) {
        resolve([]);
      }

      fs.createReadStream(data.files.squadEventsFile.filepath)
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

    const squadMembers: Array<MemberData> = await squadMembersParsing;
    const events: Array<EventData> = await eventsParsing;
    const tribeNumber: string = data.fields.tribeNumber;
    const projectNumber: string = data.fields.projectNumber;
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
    const chat = google.chat({ version: 'v1', auth: oauth2Client });

    const groupList = await admin.groups.list({ customer: 'my_customer' });

    const createdGroups: { [key: string]: { error?: string; data?: any; } } = {};
    const resultCsvData: Array<MemberData> = [];

    await Promise.allSettled(squadMembers.map(async (squadMember) => {
      const squadId: string = squadMember.squadId;

      try {
        if (createdGroups[squadId]) {
          return;
        }

        const isGroupExist = Array.isArray(groupList.data.groups) && groupList.data.groups.some((group: any) => {
          const existingGroupName: string = group.email.toLowerCase().replace('qa_tribe_', '').replace('@cerebrumhub.com', '');

          return existingGroupName.toLowerCase() === `${tribeNumber}_squad_${squadId}`;
        });

        if (isGroupExist) {
          throw new Error(`The squad with ${squadId} number already exists. Please use a different squad number.`);
        }

        const newGroup = await admin.groups.insert({
          requestBody: {
            email: `qa_tribe_${tribeNumber}_project_${projectNumber}_squad_${squadId}@cerebrumhub.com`,
            name: `QA Tribe ${tribeNumber} Squad ${squadId}`
          }
        });

        const newCalendar = await calendar.calendars.insert({
          requestBody: {
            summary: `QA Tribe ${tribeNumber} Squad ${squadId} calendar`,
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

        if (events.length > 0) {
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
        }

        createdGroups[squadId] = { data: newGroup.data };
      } catch (error) {
        createdGroups[squadId] = { error: error as string };

        return Promise.reject(error);
      }
    }));


    await Promise.allSettled(squadMembers.map(async (squadMember) => {
      const squadId: string = squadMember.squadId;

      try {
        if (createdGroups[squadId].error) {
          resultCsvData.push({ ...squadMember, result: `FAILED: ${createdGroups[squadId].error}` });

          return;
        }

        await admin.members.insert({
          groupKey: createdGroups[squadId].data.id as string,
          requestBody: {
            email: squadMember.email,
            role: 'MEMBER'
          }
        });

        resultCsvData.push({ ...squadMember, result: 'OK' });
      } catch (error) {
        resultCsvData.push({ ...squadMember, result: `FAILED: ${error}` });

        return Promise.reject(error);
      }
    }));

    const csvData = await json2csv(resultCsvData, {
      delimiter: { field: ';' },
      keys: [
        { field: 'squadId', title: 'Squad' },
        { field: 'email', title: 'Member' },
        { field: 'result', title: 'Result' }
      ]
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${data.files.squadMembersFile.originalFilename || 'result.csv'}`);

    res.status(200).end(csvData);
  } catch (error) {
    res.status(500).send({ message: error?.toString() || 'Something went wrong' });
    res.end();
  }
}
