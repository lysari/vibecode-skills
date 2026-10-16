import { MB, acceptsType, formatBytes } from '@app/shared/utils/file-preview';

describe('acceptsType', () => {
  const file = (name: string, type: string) => ({ name, type });

  it('matches exact types, wildcards and extensions', () => {
    expect(acceptsType(file('id.pdf', 'application/pdf'), 'application/pdf')).toBe(true);
    expect(acceptsType(file('me.png', 'image/png'), 'image/*')).toBe(true);
    expect(acceptsType(file('SCAN.PDF', ''), '.pdf')).toBe(true);
  });

  it('refuses what the list does not name, whatever the case or spacing', () => {
    const accept = ' image/jpeg , image/png ';
    expect(acceptsType(file('me.PNG', 'IMAGE/PNG'), accept)).toBe(true);
    expect(acceptsType(file('me.heic', 'image/heic'), accept)).toBe(false);
    expect(acceptsType(file('notes.txt', 'text/plain'), accept)).toBe(false);
  });

  it('accepts anything when the list is empty', () => {
    expect(acceptsType(file('notes.txt', 'text/plain'), '')).toBe(true);
  });
});

describe('formatBytes', () => {
  it('picks the unit and keeps a decimal only where it says something', () => {
    expect(formatBytes(512)).toMatch(/^512\s?byte/);
    expect(formatBytes(1536)).toMatch(/^1\.5\s?kB/);
    expect(formatBytes(240 * 1024)).toMatch(/^240\s?kB/);
    expect(formatBytes(3.44 * MB)).toMatch(/^3\.4\s?MB/);
    expect(formatBytes(12 * MB)).toMatch(/^12\s?MB/);
  });
});
