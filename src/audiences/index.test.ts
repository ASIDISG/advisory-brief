import { describe, expect, it } from 'vitest';
import { AUDIENCES, getAudience } from './index';
import { AudienceIdSchema } from '../brief/schema';

describe('audience profiles', () => {
  it('has one profile for every audience id the brief schema accepts', () => {
    expect(AUDIENCES.map((a) => a.id).sort()).toEqual([...AudienceIdSchema.options].sort());
  });

  it('gives every profile the guidance fields the UI renders', () => {
    for (const a of AUDIENCES) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.questionsToAsk.length).toBeGreaterThan(0);
      expect(a.whoToNotify.length).toBeGreaterThan(0);
      expect(a.typicalInfrastructure.length).toBeGreaterThan(0);
    }
  });

  it('looks a profile up by id and returns undefined for an unknown id', () => {
    expect(getAudience('wallet')?.id).toBe('wallet');
    expect(getAudience('nope')).toBeUndefined();
  });
});
