import LearnersCalendarGenerationForm from '@/components/LearnersCalendarGenerationForm';
import SquadCalendarGenerationForm from '@/components/SquadCalendarGenerationForm';

const Calendar = (): JSX.Element => {
  return (
    <div className="flex">
      <div className="w-screen h-screen max-h-screen flex flex-row justify-around items-start my-28">
        <LearnersCalendarGenerationForm />
        <SquadCalendarGenerationForm />
      </div>
    </div>
  );
};

export default Calendar;
