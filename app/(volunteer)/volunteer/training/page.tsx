'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle, ChevronRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Pagination from '../../../../components/shared/Pagination';
import { SkeletonCard } from '../../../../components/shared/SkeletonCard';
import { api } from '../../../../lib/api';

interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  lessonCount: number;
  isRequired: boolean;
  progress?: { completed: boolean };
}

export default function TrainingPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['training-courses', page],
    queryFn: () => api.get('/training', { params: { page, limit: 20 } }).then((r) => r.data),
    staleTime: 60_000,
  });

  const courses: TrainingCourse[] = data?.data ?? [];
  const completedCount = courses.filter(
    (c: TrainingCourse) => c.progress?.completed
  ).length;

  if (isLoading)
    return (
      <div className="space-y-4 max-w-2xl">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-xl">Training</h1>
            <p className="text-white/70 text-sm">Complete courses to become a better volunteer</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
        <div className="flex-1 bg-white/20 rounded-full h-2">
          <div
            className="bg-white/80 dark:bg-white/20 rounded-full h-2 transition-all"
            style={{
              width: courses.length ? `${(completedCount / courses.length) * 100}%` : '0%',
            }}
          />
        </div>
        <span className="text-sm font-semibold text-white/90">
          {completedCount}/{courses.length}
        </span>
        </div>
      </div>

      {/* Course list */}
      <div className="space-y-3">
        {!courses.length ? (
          <div className="bg-brand-surface rounded-2xl border border-brand-border p-12 text-center">
            <BookOpen className="w-10 h-10 text-brand-muted mx-auto mb-3" />
            <p className="text-brand-muted text-sm">No training courses available</p>
          </div>
        ) : (
          courses.map((course: TrainingCourse, idx: number) => {
            const isCompleted = course.progress?.completed;
            // Lock non-required courses until required ones are done
            const requiredBefore = courses
              .slice(0, idx)
              .filter((c: TrainingCourse) => c.isRequired);
            const isLocked = requiredBefore.some((c: TrainingCourse) => !c.progress?.completed);

            return (
              <div
                key={course.id}
                className={`bg-brand-surface rounded-2xl border border-brand-border overflow-hidden card-hover ${isLocked ? 'opacity-60' : ''}`}
              >
                <div className="p-5 flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isCompleted ? 'bg-brand-primary/10' : 'bg-brand-bg'}`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6 text-brand-primary" />
                    ) : isLocked ? (
                      <Lock className="w-5 h-5 text-brand-muted" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-brand-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-semibold text-brand-text truncate">
                        {course.title}
                      </h3>
                      {course.isRequired && (
                        <span className="text-[10px] font-bold bg-brand-error/10 text-brand-error px-1.5 py-0.5 rounded-full flex-shrink-0">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-muted mt-0.5 line-clamp-1">
                      {course.description}
                    </p>
                    <p className="text-xs text-brand-muted mt-1">
                      {course.lessonCount} lessons · {course.category}
                    </p>
                  </div>
                  {!isLocked && (
                    <Link href={`/volunteer/training/${course.id}`} className="flex-shrink-0">
                      <ChevronRight className="w-5 h-5 text-brand-muted hover:text-brand-primary transition-colors cursor-pointer" />
                    </Link>
                  )}
                </div>
                {isCompleted && <div className="h-1 bg-brand-primary" />}
              </div>
            );
          })
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} setPage={setPage} />
    </div>
  );
}
