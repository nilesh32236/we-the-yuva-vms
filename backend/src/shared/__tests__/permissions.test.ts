import { describe, expect, it } from 'vitest';

import { Permissions } from '../permissions';

describe('permissions', () => {
  it('should have SYSTEM_CONFIG permission', () => {
    expect(Permissions.SYSTEM_CONFIG).toBe('system:config');
  });

  it('should have user permissions', () => {
    expect(Permissions.USER_MANAGE).toBe('user:manage');
    expect(Permissions.USER_PROFILE_MANAGE).toBe('user:profile:manage');
    expect(Permissions.USER_PROFILE_VIEW).toBe('user:profile:view');
    expect(Permissions.USER_EVENTS_VIEW).toBe('user:events:view');
    expect(Permissions.USER_VOLUNTEERS_MANAGE).toBe('user:volunteers:manage');
  });

  it('should have opportunity permissions', () => {
    expect(Permissions.OPPORTUNITY_CREATE).toBe('opportunity:create');
    expect(Permissions.OPPORTUNITY_EDIT).toBe('opportunity:edit');
    expect(Permissions.OPPORTUNITY_VIEW).toBe('opportunity:view');
    expect(Permissions.OPPORTUNITY_APPLY).toBe('opportunity:apply');
    expect(Permissions.OPPORTUNITY_MANAGE).toBe('opportunity:manage');
  });

  it('should have event permissions', () => {
    expect(Permissions.EVENT_CREATE).toBe('event:create');
    expect(Permissions.EVENT_EDIT).toBe('event:edit');
    expect(Permissions.EVENT_MANAGE).toBe('event:manage');
    expect(Permissions.EVENT_CHECKIN).toBe('event:checkin');
  });

  it('should have stats permissions', () => {
    expect(Permissions.STATS_VIEW_OWN).toBe('stats:view:own');
    expect(Permissions.STATS_VIEW_OBSERVER).toBe('stats:view:observer');
  });

  it('should have story permissions', () => {
    expect(Permissions.STORY_CREATE).toBe('story:create');
    expect(Permissions.STORY_EDIT).toBe('story:edit');
    expect(Permissions.STORY_MODERATE).toBe('story:moderate');
    expect(Permissions.STORY_VIEW_ALL).toBe('story:view:all');
  });

  it('should have training permissions', () => {
    expect(Permissions.TRAINING_CREATE).toBe('training:create');
    expect(Permissions.TRAINING_EDIT).toBe('training:edit');
    expect(Permissions.TRAINING_COMPLETE).toBe('training:complete');
  });

  it('should have alert permission', () => {
    expect(Permissions.ALERT_MANAGE).toBe('alert:manage');
  });

  it('should have feedback permissions', () => {
    expect(Permissions.FEEDBACK_SUBMIT).toBe('feedback:submit');
    expect(Permissions.FEEDBACK_MANAGE).toBe('feedback:manage');
  });

  it('should have org permissions', () => {
    expect(Permissions.ORG_CREATE).toBe('org:create');
    expect(Permissions.ORG_MANAGE).toBe('org:manage');
    expect(Permissions.ORG_VERIFY).toBe('org:verify');
  });

  it('should have coordinator permission', () => {
    expect(Permissions.COORDINATOR_MANAGE).toBe('coordinator:manage');
  });

  it('should be frozen (as const)', () => {
    expect(Object.isFrozen(Permissions)).toBe(false);
  });

  it('should have all unique values', () => {
    const values = Object.values(Permissions);
    expect(new Set(values).size).toBe(values.length);
  });
});
