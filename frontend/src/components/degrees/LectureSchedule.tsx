/**
 * LectureSchedule - Component for displaying and managing lecture schedules
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { degreesAPI } from '../../api/degrees';
import type { Lecture } from '../../types/degrees';

interface LectureScheduleProps {
  lectures: Lecture[];
  moduleId: string;
  onAdd?: () => void;
  onEdit?: (lecture: Lecture) => void;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function LectureSchedule({
  lectures,
  moduleId,
  onAdd,
  onEdit
}: LectureScheduleProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nextLecture, setNextLecture] = useState<{
    lecture: Lecture;
    countdown: string;
  } | null>(null);

  // Delete lecture mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await degreesAPI.deleteLecture(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lectures', moduleId] });
      setDeletingId(null);
    },
    onError: () => {
      setDeletingId(null);
    }
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lecture?')) {
      setDeletingId(id);
      await deleteMutation.mutateAsync(id);
    }
  };

  // Calculate next lecture and countdown
  useEffect(() => {
    const calculateNextLecture = () => {
      if (lectures.length === 0) {
        setNextLecture(null);
        return;
      }

      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.getHours() * 60 + now.getMinutes();

      let closestLecture: Lecture | null = null;
      let minDiff = Infinity;

      lectures.forEach((lecture) => {
        // Convert day_of_week (0 = Monday) to JavaScript day (0 = Sunday)
        const lectureDayJS = lecture.day_of_week === 6 ? 0 : lecture.day_of_week + 1;

        const [hours, minutes] = lecture.start_time.split(':').map(Number);
        const lectureTime = hours * 60 + minutes;

        // Calculate days until lecture
        let daysUntil = lectureDayJS - currentDay;
        if (daysUntil < 0) daysUntil += 7;
        if (daysUntil === 0 && lectureTime <= currentTime) daysUntil = 7;

        const totalMinutesUntil = daysUntil * 24 * 60 + (lectureTime - currentTime);

        if (totalMinutesUntil > 0 && totalMinutesUntil < minDiff) {
          minDiff = totalMinutesUntil;
          closestLecture = lecture;
        }
      });

      if (closestLecture) {
        const days = Math.floor(minDiff / (24 * 60));
        const hours = Math.floor((minDiff % (24 * 60)) / 60);
        const mins = minDiff % 60;

        let countdown = '';
        if (days > 0) countdown += `${days}d `;
        if (hours > 0 || days > 0) countdown += `${hours}h `;
        countdown += `${mins}m`;

        setNextLecture({ lecture: closestLecture, countdown: countdown.trim() });
      } else {
        setNextLecture(null);
      }
    };

    calculateNextLecture();
    const interval = setInterval(calculateNextLecture, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lectures]);

  // Group lectures by day
  const lecturesByDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    lectures: lectures
      .filter((l) => l.day_of_week === index)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }));

  if (lectures.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-600">No lectures scheduled yet.</p>
        <p className="text-sm text-gray-500 mt-2">Click "+ Add Lecture" to add your first lecture.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Next Lecture Countdown */}
      {nextLecture && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-1">
                Next Lecture
              </h3>
              <div className="text-2xl font-bold text-gray-900">
                {nextLecture.lecture.title || `${DAYS_OF_WEEK[nextLecture.lecture.day_of_week]} Lecture`}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {DAYS_OF_WEEK[nextLecture.lecture.day_of_week]} at {nextLecture.lecture.start_time}
                {nextLecture.lecture.location && ` • ${nextLecture.lecture.location}`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{nextLecture.countdown}</div>
              <div className="text-sm text-gray-600">until start</div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Timetable */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-200">
          {lecturesByDay.map(({ day, lectures: dayLectures }) => (
            <div key={day} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-24 flex-shrink-0">
                  <div className="font-bold text-gray-900">{day}</div>
                  {dayLectures.length === 0 && (
                    <div className="text-xs text-gray-400 mt-1">No lectures</div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  {dayLectures.map((lecture) => {
                    const isNext = nextLecture?.lecture.id === lecture.id;

                    return (
                      <div
                        key={lecture.id}
                        className={`border rounded-lg p-4 transition-all ${
                          isNext
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-gray-900">
                                {lecture.title || 'Lecture'}
                              </span>
                              {isNext && (
                                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                  Next
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>
                                  {lecture.start_time} - {lecture.end_time}
                                </span>
                              </div>
                              {lecture.location && (
                                <div className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                  </svg>
                                  <span>{lecture.location}</span>
                                </div>
                              )}
                            </div>
                            {lecture.notes && (
                              <div className="mt-2 text-sm text-gray-600 italic">
                                {lecture.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => onEdit?.(lecture)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Edit lecture"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(lecture.id)}
                              disabled={deletingId === lecture.id}
                              className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                              title="Delete lecture"
                            >
                              {deletingId === lecture.id ? (
                                <div className="animate-spin h-5 w-5 border-2 border-red-600 border-t-transparent rounded-full"></div>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
