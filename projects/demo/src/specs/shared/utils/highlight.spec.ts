import { highlight } from '@app/shared/utils/highlight';

describe('highlight', () => {
  it('splits the text around the match, whatever its case', () => {
    expect(highlight('Kampong Cham', 'pong')).toEqual({
      before: 'Kam',
      match: 'pong',
      after: ' Cham',
    });
    expect(highlight('Kampong Cham', 'kam')).toEqual({
      before: '',
      match: 'Kam',
      after: 'pong Cham',
    });
  });

  it('leaves the text whole when nothing matches, or nothing is asked', () => {
    expect(highlight('Kep', 'zz')).toEqual({ before: 'Kep', match: '', after: '' });
    expect(highlight('Kep', '')).toEqual({ before: 'Kep', match: '', after: '' });
  });

  it('never cuts a Khmer cluster: a trailing sign stays with its base', () => {
    // "ព្រ" matches inside "ព្រះ"; the visarga "ះ" is a mark on the same cluster.
    expect(highlight('ព្រះវិហារ', 'ព្រ')).toEqual({ before: '', match: 'ព្រះ', after: 'វិហារ' });
  });

  it('takes the subscript consonant along with its coeng', () => {
    // A query ending on the coeng sign must not strand the consonant it subscripts.
    expect(highlight('ស្ទឹងត្រែង', 'ស្').match).toBe('ស្ទឹ');
  });

  it('widens backwards when the match starts on a mark', () => {
    expect(highlight('កំពត', 'ំព').match).toBe('កំព');
  });
});
