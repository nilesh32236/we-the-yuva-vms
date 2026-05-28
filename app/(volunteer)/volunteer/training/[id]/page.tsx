'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Circle } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { SkeletonCard } from '../../../../../components/shared/SkeletonCard';
import { useToast } from '../../../../../hooks/use-toast';
import { api } from '../../../../../lib/api';

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const { data: course, isLoading } = useQuery({
    queryKey: ['training-course', id],
    queryFn: () => api.get(`/training/${id}`).then((r) => r.data),
    staleTime: 30_000,
  });

  const complete = useMutation({
    mutationFn: (lessonId: string) => api.post(`/training/${id}/lessons/${lessonId}/complete`),
    onSuccess: (_, lessonId) => {
      qc.invalidateQueries({ queryKey: ['training-course', id] });
      qc.invalidateQueries({ queryKey: ['training-courses'] });
      toast({ title: 'Lesson completed!', description: 'Keep going!' });
      // Auto-advance to next lesson
      const lessons = course?.lessons ?? [];
      const idx = lessons.findIndex((l: { id: string }) => l.id === lessonId);
      if (idx < lessons.length - 1) setActiveLesson(lessons[idx + 1].id);
    },
  });

  if (isLoading)
    return (
      <div className="max-w-3xl space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  if (!course) return <div className="text-brand-muted text-sm">Course not found.</div>;

  const completedCount = course.lessons.filter((l: { completed: boolean }) => l.completed).length;
  const currentLesson =
    course.lessons.find((l: { id: string; completed: boolean }) => l.id === activeLesson) ??
    course.lessons.find((l: { completed: boolean }) => !l.completed) ??
    course.lessons[0];

  return (
    <div className="max-w-4xl">
      <Link
        href="/volunteer/training"
        className="inline-flex items-center gap-1.5 text-sm text-brand-muted hover:text-brand-text transition-colors cursor-pointer mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Training
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Lesson list */}
        <div className="md:col-span-1 space-y-2">
          <div className="bg-white rounded-2xl border border-brand-border p-4">
            <h2 className="font-heading font-semibold text-sm text-brand-text mb-1">
              {course.title}
            </h2>
            <p className="text-xs text-brand-muted mb-3">
              {completedCount}/{course.lessons.length} completed
            </p>
            <div className="w-full bg-brand-bg rounded-full h-1.5 mb-4">
              <div
                className="bg-brand-primary h-1.5 rounded-full transition-all"
                style={{
                  width: `${course.lessons.length ? (completedCount / course.lessons.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="space-y-1">
              {course.lessons.map(
                (lesson: { id: string; completed: boolean; title: string }, idx: number) => (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer
                    ${currentLesson?.id === lesson.id ? 'bg-brand-primary text-white' : 'hover:bg-brand-bg'}`}
                  >
                    {lesson.completed ? (
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 ${currentLesson?.id === lesson.id ? 'text-white' : 'text-emerald-600'}`}
                      />
                    ) : (
                      <Circle
                        className={`w-4 h-4 flex-shrink-0 ${currentLesson?.id === lesson.id ? 'text-white/60' : 'text-brand-muted'}`}
                      />
                    )}
                    <span
                      className={`text-xs font-medium truncate ${currentLesson?.id === lesson.id ? 'text-white' : 'text-brand-text'}`}
                    >
                      {idx + 1}. {lesson.title}
                    </span>
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Lesson content */}
        <div className="md:col-span-2">
          {currentLesson ? (
            <div className="bg-white rounded-2xl border border-brand-border p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-heading font-bold text-xl text-brand-text">
                  {currentLesson.title}
                </h3>
                {currentLesson.completed && (
                  <span className="flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full flex-shrink-0">
                    <CheckCircle className="w-3 h-3" /> Done
                  </span>
                )}
              </div>

              <div className="prose prose-sm max-w-none text-brand-muted leading-relaxed whitespace-pre-line">
                {currentLesson.content}
              </div>

              {!currentLesson.completed && (
                <button
                  onClick={() => complete.mutate(currentLesson.id)}
                  disabled={complete.isPending}
                  className="w-full bg-brand-primary text-white py-3 rounded-xl font-semibold text-sm hover:bg-brand-secondary transition-colors cursor-pointer disabled:opacity-60"
                >
                  {complete.isPending ? 'Saving…' : 'Mark as Complete →'}
                </button>
              )}

              {currentLesson.completed && completedCount < course.lessons.length && (
                <button
                  onClick={() => {
                    const idx = course.lessons.findIndex(
                      (l: { id: string }) => l.id === currentLesson.id
                    );
                    if (idx < course.lessons.length - 1)
                      setActiveLesson(course.lessons[idx + 1].id);
                  }}
                  className="w-full border border-brand-border text-brand-text py-3 rounded-xl font-semibold text-sm hover:bg-brand-bg transition-colors cursor-pointer"
                >
                  Next Lesson →
                </button>
              )}

              {completedCount === course.lessons.length && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                  <p className="font-heading font-bold text-emerald-700">Course Complete!</p>
                  <p className="text-sm text-emerald-600 mt-1">
                    You have finished all lessons in this course.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-brand-border p-10 text-center text-brand-muted">
              Select a lesson to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
